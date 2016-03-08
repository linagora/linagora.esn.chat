'use strict';

var CONSTANTS = require('../lib/constants');
var initialized = false;
var NAMESPACE = CONSTANTS.WEBSOCKET.NAMESPACE;
var chatNamespace;

function init(dependencies) {
  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub').global;
  var io = dependencies('wsserver').io;

  function sendMessage(event, data) {
    if (chatNamespace) {
      chatNamespace.to(data.channelId).emit(event, {
        room: data.channelId,
        data: data
      });
    }
  }

  if (initialized) {
    logger.warn('The chat notification service is already initialized');
    return;
  }

  pubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(function(data) {
    sendMessage(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED, data);
  });

  chatNamespace = io.of(NAMESPACE);
  chatNamespace.on('connection', function(socket) {
    logger.info('New connection on ' + NAMESPACE);

    socket.on('subscribe', function(channelId) {
      logger.info('Joining chat channel', channelId);
      socket.join(channelId);
    });

    socket.on('unsubscribe', function(channelId) {
      logger.info('Leaving chat channel', channelId);
      socket.leave(channelId);
    });
  });

  initialized = true;
}

module.exports.init = init;
