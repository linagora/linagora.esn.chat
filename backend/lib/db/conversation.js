'use strict';

var uuid = require('node-uuid');
var cleanUser = require('./utils').cleanUser;
var CONSTANTS = require('../constants');
var CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies) {

  var mongoose = dependencies('db').mongo.mongoose;
  var ObjectId = mongoose.Schema.ObjectId;

  var ConversationSchema = new mongoose.Schema({
    name: {type: String},
    type: {type: String, enum: [CONVERSATION_TYPE.CHANNEL, CONVERSATION_TYPE.PRIVATE, CONVERSATION_TYPE.COMMUNITY], required: true, index: true},
    creator: {type: ObjectId, ref: 'User'},
    isNotRead: {type: Boolean},
    members: [{type: ObjectId, ref: 'User', index: true}],
    community: {type: ObjectId, ref: 'Community', index: true, unique: true, sparse: true},
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
    activity_stream: {
      uuid: {type: String, default: uuid.v4},
      timestamps: {
        creation: {type: Date, default: Date.now}
      }
    },
    last_message: {
      text: {type: String},
      date: {type: Date}
    },
    schemaVersion: {type: Number, default: 1}
  });

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
