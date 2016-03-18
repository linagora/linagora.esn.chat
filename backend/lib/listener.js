'use strict';

var CONSTANTS = require('./constants');
var mongoose = require('mongoose');
var Whatsup = mongoose.model('Whatsup');
var ChatMessage = mongoose.model('ChatMessage');

module.exports = function(dependencies) {

  var localPubsub = dependencies('pubsub').local;
  var helpers = dependencies('helpers');
  var userModule = dependencies('user');
  var logger = dependencies('logger');

  function start() {
    var channel = require('./channel');

    function saveInActivityStream(data) {
      var userId = data.message.user;

      userModule.get(userId, function(err, user) {
        if (err) {
          logger.error('Can not get user', err);
          return;
        }

        channel.getChannel(data.message.channel, function(err, response) {
          if (err) {
            logger.error('Cannot find channel: %s', data.message.channel, err);
            return;
          }

          var targets = [{
            objectType: 'activitystream',
            id: response.activity_stream.uuid
          }];

          var message = {
            objectType: 'whatsup',
            content: data.message.text,
            author: userId,
            shares: targets
          };

          var whatsup = new Whatsup(message);
          whatsup.save(function(err, savedMessage) {
            if (err) {
              logger.error('Error while saving chat message', err);
            } else {
              logger.debug('Saved chat message', savedMessage);
              helpers.message.publishMessageEvents(savedMessage, targets, user, 'post');
            }
          });
        });
      });
    }

    function saveAsChatMessage(data) {
      var chatMessage = new ChatMessage({
        type: data.message.type,
        text: data.message.text,
        creator: data.message.user,
        channel: data.message.channel
      });

      if (data.message.attachments) {
        chatMessage.attachments = data.message.attachments;
      }
      chatMessage.save(function(err, result) {
        if (err) {
          logger.error('Can not save ChatMessage', err);
        }
        logger.debug('Chat Message saved', result);
      });
    }

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(function(data) {
      if (data.message.type === 'user_typing') {
        return;
      }
      saveInActivityStream(data);
    });

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
