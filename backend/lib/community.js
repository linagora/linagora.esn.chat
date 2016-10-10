'use strict';

const CONSTANTS = require('../lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const SKIP_FIELDS = CONSTANTS.SKIP_FIELDS;

module.exports = function(dependencies, lib) {

  const mongoose = dependencies('db').mongo.mongoose;
  const Conversation = mongoose.model('ChatConversation');
  const ensureObjectId = require('./utils')(dependencies).ensureObjectId;

  return {
    getConversationByCommunityId,
    updateConversation
  };

  function getConversationByCommunityId(communityId, callback) {
    Conversation.findOne({type: CONVERSATION_TYPE.COMMUNITY, community: communityId}).populate('members', SKIP_FIELDS.USER).exec(callback);
  }

  function updateConversation(communityId, modifications, callback) {

    let mongoModifications = {};

    if (modifications.newMembers) {
      mongoModifications.$addToSet = {
        members: {
          $each: modifications.newMembers.map(ensureObjectId)
        }
      };
    }

    if (modifications.deleteMembers) {
      mongoModifications.$pullAll = {
        members: modifications.deleteMembers.map(ensureObjectId)
      };
    }

    if (modifications.title) {
      mongoModifications.$set = {name: modifications.title};
    }

    Conversation.findOneAndUpdate({type: CONVERSATION_TYPE.COMMUNITY, community: communityId}, mongoModifications, (err, conversation) => {
      if (err) {
        return callback(err);
      }

      if (mongoModifications.$addToSet) {
        lib.conversation.markAllAsRead(mongoModifications.$addToSet.$each, conversation, callback);
      } else {
        callback(err, conversation);
      }
    });
  }

};
