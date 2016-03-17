'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;
var uuid = require('node-uuid');

var ChannelSchema = new mongoose.Schema({
  name: {type: String},
  type: {type: String, required: true},
  creator: {type: ObjectId, ref: 'User'},
  isNotRead: {type: Boolean},
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
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('Channel', ChannelSchema);
