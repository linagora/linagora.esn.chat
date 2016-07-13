'use strict';

var uuid = require('node-uuid');
var cleanUser = require('./utils').cleanUser;
var CONSTANTS = require('../constants');
var CHANNEL_TYPE = CONSTANTS.CHANNEL_TYPE;

module.exports = function(dependencies) {

  var mongoose = dependencies('db').mongo.mongoose;
  var ObjectId = mongoose.Schema.ObjectId;

  var ChannelSchema = new mongoose.Schema({
    name: {type: String},
    type: {type: String, enum: [CHANNEL_TYPE.CHANNEL, CHANNEL_TYPE.GROUP], required: true},
    creator: {type: ObjectId, ref: 'User'},
    isNotRead: {type: Boolean},
    members: [{type: ObjectId, ref: 'User'}],
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

  function cleanChannel(original, object) {
    object.members && object.members.map(cleanUser);

    return object;
  }

  ChannelSchema.options.toObject = ChannelSchema.options.toObject || {};
  ChannelSchema.options.toObject.transform = cleanChannel;

  ChannelSchema.options.toJSON = ChannelSchema.options.toJSON || {};
  ChannelSchema.options.toJSON.transform = cleanChannel;

  return mongoose.model('ChatChannel', ChannelSchema);
};
