'use strict';

var mongoose = require('mongoose');
var Channel = mongoose.model('Channel');

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
