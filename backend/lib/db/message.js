'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
var uuid = require('node-uuid');

var ChatMessageSchema = new mongoose.Schema({
  text: {type: String},
  type: {type: String, required: true},
  creator: {type: ObjectId, ref: 'User'},
  channel: {type: ObjectId, ref: 'Channel'},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
