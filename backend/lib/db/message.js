'use strict';

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
    channel: {type: ObjectId, ref: 'Channel'},
    attachments: {type: [AttachmentSchema], required: false},
    user_mentions: [{type: ObjectId, ref: 'User'}],
    timestamps: {
      creation: {type: Date, default: Date.now}
    },
    schemaVersion: {type: Number, default: 1}
  });

  return mongoose.model('ChatMessage', ChatMessageSchema);
};
