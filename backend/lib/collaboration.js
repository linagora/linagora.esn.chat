'use strict';

const CONSTANTS = require('../lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies) {

  const collaborationModule = dependencies('collaboration');
  const mongoose = dependencies('db').mongo.mongoose;
  const Conversation = mongoose.model('ChatConversation');

  return {
    getConversation,
    getCollaboration,
    listForUser,
    userCanWrite
  };

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
