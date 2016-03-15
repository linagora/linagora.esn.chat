'use strict';

var CONSTANTS = require('./constants');
var mongoose = require('mongoose');
var Whatsup = mongoose.model('Whatsup');

module.exports = function(dependencies) {

  var localPubsub = dependencies('pubsub').local;
  var logger = dependencies('logger');

  function start() {
    var channel = require('./channel');

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(function(data) {
      if(data.message.type === 'user_typing') {
        return;
      }
      channel.getChannel(data.message.channel, function(err, response) {
        if (err) {
          logger.error('Cannot find channel: %s', data.message.channel, err);
          return;
        }

        var message = {
          objectType: 'whatsup',
          content: data.message.text,
          author: data.message.user,
          shares: [
            {
              'objectType': 'activitystream',
              'id': response.activity_stream.uuid
            }
          ]
        };

        var whatsup = new Whatsup(message);
        whatsup.save(function(err, response) {
          if (err) {
            logger.error('Error while saving whatsup', err);
          }
          logger.debug('Response: ', response);
        });
      });
    });
  }

  return {
    start: start
  };
};
