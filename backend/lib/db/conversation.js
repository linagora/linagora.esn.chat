'use strict';

const CONSTANTS = require('../constants');
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Schema.ObjectId;
  const baseCollaboration = dependencies('db').mongo.models['base-collaboration'];
  const collaborationModule = dependencies('collaboration');

  const ConversationDefinition = {
    name: {type: String},
    // collaboration type
    type: {type: String, trim: true, required: true, default: 'open'},
    mode: {type: String, trim: true, default: CONVERSATION_MODE.CHANNEL},
    avatar: ObjectId,
    isNotRead: {type: Boolean},
    moderate: {type: Boolean, default: false},
    topic: {
      value: {type: String},
      creator: {type: ObjectId, ref: 'User'},
      last_set: {type: Date, default: Date.now}
    },
    purpose: {
      value: {type: String},
      creator: {type: ObjectId, ref: 'User'},
      last_set: {type: Date, default: Date.now}
    },
    timestamps: {
      creation: {type: Date, default: Date.now}
    },
    last_message: {
      text: {type: String},
      date: {type: Date},
      creator: {type: ObjectId, ref: 'User'},
      user_mentions: [{type: ObjectId, ref: 'User'}]
    },
    domain: {type: ObjectId, ref: 'Domain'},
    membershipRequests: [
      {
        user: {type: ObjectId, ref: 'User'},
        workflow: {type: String, required: true},
        timestamp: {
          creation: {type: Date, default: Date.now}
        }
      }
    ],
    schemaVersion: {type: Number, default: 1},
    numOfReadedMessage: mongoose.Schema.Types.Mixed, // this will be a map that associate a num of unread message to a userId (ie: { 'userId1': 0, 'userId2': 2, 'userId3': 3})
    numOfMessage: {type: Number, default: 0}
  };

  const ConversationSchema = baseCollaboration(ConversationDefinition, CONSTANTS.OBJECT_TYPES.CONVERSATION);

  return collaborationModule.registerCollaborationModel(CONSTANTS.OBJECT_TYPES.CONVERSATION, 'ChatConversation', ConversationSchema);
};
