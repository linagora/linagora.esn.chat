'use strict';

const CONSTANTS = require('../constants');
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Schema.ObjectId;

  return {
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
    memberStates: mongoose.Schema.Types.Mixed, // this will be a map that associates a state of a member to his id (ie: { 'userId1': { 'numOfReadMessages': 3, 'numOfUnseenMentions': 2 } })
    numOfMessage: {type: Number, default: 0}
  };

};
