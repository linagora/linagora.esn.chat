'use strict';

var mongoose = require('mongoose');
var Channel = mongoose.model('Channel');

function getChannels(options, callback) {
  Channel.find(callback);
}
module.exports.getChannels = getChannels;

function createChannel(options, callback) {
  var channel = new Channel(options);
  channel.save(callback);
}
module.exports.createChannel = createChannel;
