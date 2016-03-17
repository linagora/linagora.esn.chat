'use strict';

var mongoose = require('mongoose');
var Channel = mongoose.model('Channel');
var ChatMessage = mongoose.model('ChatMessage');

function getChannels(options, callback) {
  Channel.find(callback);
}
module.exports.getChannels = getChannels;

function getChannel(channel, callback) {
  Channel.findById(channel, callback);
}
module.exports.getChannel = getChannel;

function createChannel(options, callback) {
  var channel = new Channel(options);
  channel.save(callback);
}
module.exports.createChannel = createChannel;

function addMessage(channel, message, callback) {
  return callback();
}
module.exports.addMessage = addMessage;

function getMessages(channel, query, callback) {
  query = query || {};
  var channelId = channel._id || channel;
  var q = {channel: channelId};
  var mq = ChatMessage.find(q);
  mq.populate('creator');
  mq.limit(query.limit || 20);
  mq.skip(query.offset || 0);
  mq.sort('-timestamps.creation');
  mq.exec(callback);
}
module.exports.getMessages = getMessages;
