'use strict';

const Q = require('q');
const CONSTANTS = require('../lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const collaborationModule = dependencies('collaboration');
  const userModule = dependencies('user');
  const mongoose = dependencies('db').mongo.mongoose;
  const Conversation = mongoose.model('ChatConversation');

  return {
    getConversation,
    getCollaboration,
    getMembers,
    listForUser,
    userCanWrite
  };

  function getMembers(conversation) {
    let defer = Q.defer();

    getCollaboration(conversation.collaboration, (err, collaboration) => {
      if (err) {
        logger.error('Error while getting collaboration', err);

        return defer.reject(new Error('Error while getting collaboration from conversation'));
      }

      if (!collaboration) {
        logger.error('Error while getting collaboration', err);

        return defer.reject(new Error('Can not find collaboration from conversation'));
      }

      let promises = (collaboration.members || [])
        .filter(member => member.member.objectType === 'user' && member.status === 'joined')
        .map(member => Q.nfapply(userModule.get, [member.member.id]));

      Q.all(promises).then(defer.resolve);
    });

    return defer.promise;
  }

  function getConversation(collaborationTuple, callback) {
    Conversation.findOne({type: CONVERSATION_TYPE.COLLABORATION, collaboration: collaborationTuple}).exec(callback);
  }

  function getCollaboration(collaborationTuple, callback) {
    collaborationModule.queryOne(collaborationTuple.objectType, {_id: collaborationTuple.id}, callback);
  }

  function listForUser(user, callback) {
    collaborationModule.getCollaborationsForUser(user._id, {member: true}, (err, collaborations) => {
      if (err) {
        return callback(err);
      }

      const query = collaborations.map(collaboration => ({'collaboration.objectType': collaboration.objectType, 'collaboration.id': String(collaboration._id)}));

      Conversation.find({type: CONVERSATION_TYPE.COLLABORATION, $or: query}).exec(callback);
    });
  }

  function userCanWrite(user, collaboration, callback) {
    collaborationModule.permission.canWrite(collaboration, {id: String(user._id), objectType: 'user'}, callback);
  }
};
