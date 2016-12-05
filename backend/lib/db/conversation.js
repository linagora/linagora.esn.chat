'use strict';

const cleanUser = require('./utils').cleanUser;
const CONSTANTS = require('../constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Schema.ObjectId;

  const ConversationSchema = new mongoose.Schema({
    name: {type: String},
    type: {type: String, enum: [CONVERSATION_TYPE.CHANNEL, CONVERSATION_TYPE.PRIVATE, CONVERSATION_TYPE.COLLABORATION], required: true, index: true},
    creator: {type: ObjectId, ref: 'User'},
    avatar: ObjectId,
    isNotRead: {type: Boolean},
    members: [{type: ObjectId, ref: 'User', index: true}],
    collaboration: {
      id: {type: String},
      objectType: {type: String}
    },
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
    schemaVersion: {type: Number, default: 1},
    numOfReadedMessage: mongoose.Schema.Types.Mixed, // this will be a map that associate a num of unread message to a userId (ie: { 'userId1': 0, 'userId2': 2, 'userId3': 3})
    numOfMessage: {type: Number, default: 0}
  });

  /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
  function cleanConversation(original, object) {
    object.members && object.members.map(cleanUser);

    return object;
  }

  ConversationSchema.options.toObject = ConversationSchema.options.toObject || {};
  ConversationSchema.options.toObject.transform = cleanConversation;

  ConversationSchema.options.toJSON = ConversationSchema.options.toJSON || {};
  ConversationSchema.options.toJSON.transform = cleanConversation;

  return mongoose.model('ChatConversation', ConversationSchema);
};
