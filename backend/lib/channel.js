'use strict';

module.exports = function(dependencies) {

  var mongoose = dependencies('db').mongo.mongoose;
  var Channel = mongoose.model('ChatChannel');
  var ChatMessage = mongoose.model('ChatMessage');

  function getChannels(options, callback) {
    Channel.find(callback);
  }

  function getChannel(channel, callback) {
    Channel.findById(channel, callback);
  }

  function createChannel(options, callback) {
    var channel = new Channel(options);
    channel.save(callback);
  }

  function createMessage(message, callback) {
    var chatMessage = new ChatMessage(message);
    return chatMessage.save(callback);
  }

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

  return {
    getMessages: getMessages,
    createMessage: createMessage,
    createChannel: createChannel,
    getChannel: getChannel,
    getChannels: getChannels
  };

};
