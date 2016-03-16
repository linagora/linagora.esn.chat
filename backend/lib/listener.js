'use strict';

var CONSTANTS = require('./constants');
var mongoose = require('mongoose');
var Whatsup = mongoose.model('Whatsup');

module.exports = function(dependencies) {

  var localPubsub = dependencies('pubsub').local;
  var helpers = dependencies('helpers');
  var userModule = dependencies('user');
  var logger = dependencies('logger');

  function start() {
    var channel = require('./channel');

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(function(data) {
      if (data.message.type === 'user_typing') {
        return;
      }

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
    });
  }

  return {
    start: start
  };
};
