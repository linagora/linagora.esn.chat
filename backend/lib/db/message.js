'use strict';

var cleanUser = require('./utils').cleanUser;

module.exports = function(dependencies) {

  var mongoose = dependencies('db').mongo.mongoose;
  var ObjectId = mongoose.Schema.ObjectId;

  var AttachmentSchema = new mongoose.Schema({
    _id: {type: ObjectId, required: true},
    name: {type: String, required: true},
    contentType: {type: String, required: true},
    length: {type: Number, required: true}
  });

  var ChatMessageSchema = new mongoose.Schema({
    text: {type: String},
    type: {type: String, required: true},
    creator: {type: ObjectId, ref: 'User'},
    channel: {type: ObjectId, ref: 'ChatConversation', index: true},
    attachments: {type: [AttachmentSchema], required: false},
    user_mentions: [{type: ObjectId, ref: 'User'}],
    timestamps: {
      creation: {type: Date, default: Date.now}
    },
    schemaVersion: {type: Number, default: 1}
  });

  function cleanMessage(original, object) {
    object.creator && cleanUser(object.creator);
    object.user_mentions && object.user_mentions.map(cleanUser);

    if (object.timestamps) {
      object.timestamps.creation = object.timestamps.creation.getTime();
    }

    return object;
  }

  ChatMessageSchema.options.toObject = ChatMessageSchema.options.toObject || {};
  ChatMessageSchema.options.toObject.transform = cleanMessage;

  ChatMessageSchema.options.toJSON = ChatMessageSchema.options.toJSON || {};
  ChatMessageSchema.options.toJSON.transform = cleanMessage;

  return mongoose.model('ChatMessage', ChatMessageSchema);
};
