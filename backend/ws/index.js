'use strict';

var CONSTANTS = require('../lib/constants');
var initialized = false;
var NAMESPACE = CONSTANTS.WEBSOCKET.NAMESPACE;
var chatNamespace;

function init(dependencies) {
  var logger = dependencies('logger');
  var globalPubsub = dependencies('pubsub').global;
  var localPubsub = dependencies('pubsub').local;
  var io = dependencies('wsserver').io;
  var helper = dependencies('wsserver').ioHelper;

  function sendMessage(room, message) {
    chatNamespace.emit('message', {room: room, data: message});
  }

  if (initialized) {
    logger.warn('The chat notification service is already initialized');
    return;
  }

  globalPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(function(data) {
    sendMessage(data.room, data.message);
  });

  chatNamespace = io.of(NAMESPACE);

  var room = '123';

  chatNamespace.on('connection', function(socket) {
    var userId = helper.getUserId(socket);
    logger.info('New connection on %s by user %s', NAMESPACE, userId);

    socket.on('subscribe', function (channel) {
      logger.info('Joining chat channel', channel);
      socket.join(channel);

      sendMessage(room, {
        type: 'hello',
        channel: channel,
        user: userId
      });

      socket.on('unsubscribe', function (channel) {
        logger.info('Leaving chat channel', channel);
        socket.leave(channel);
      });

      socket.on('message', function(data) {
        var message = {user: userId, type: data.type, date: Date.now(), text: data.text};
        localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).publish({room: room, message: message});
        sendMessage(room, message);
      });
    });

    initialized = true;
  });
}

module.exports.init = init;
