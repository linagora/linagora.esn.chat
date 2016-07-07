'use strict';

var CONSTANTS = require('./constants');

module.exports = function(dependencies) {

  var localPubsub = dependencies('pubsub').local;
  var logger = dependencies('logger');

  function start(channel) {

    function saveAsChatMessage(data) {
      var chatMessage = {
        type: data.message.type,
        text: data.message.text,
        creator: data.message.creator,
        channel: data.message.channel
      };

      if (data.message.attachments) {
        chatMessage.attachments = data.message.attachments;
      }

      channel.createMessage(chatMessage, function(err, result) {
        if (err) {
          logger.error('Can not save ChatMessage', err);
          return;
        }
        logger.debug('Chat Message saved', result);
      });
    }

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(function(data) {
      if (data.message.type === 'user_typing') {
        return;
      }
      saveAsChatMessage(data);
    });
  }

  return {
    start: start
  };
};
