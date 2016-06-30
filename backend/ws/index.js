'use strict';

var CONSTANTS = require('../lib/constants');
var initialized = false;
var NAMESPACE = CONSTANTS.WEBSOCKET.NAMESPACE;
var chatNamespace;
var USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
var TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
var MESSAGE_RECEIVED = CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED;

function init(dependencies) {
  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub');
  var localPubsub = pubsub.local;
  var globalPubsub = pubsub.global;
  var io = dependencies('wsserver').io;
  var helper = dependencies('wsserver').ioHelper;

  function sendMessage(room, message) {
    chatNamespace.emit('message', {room: room, data: message});
  }

  if (initialized) {
    logger.warn('The chat notification service is already initialized');
    return;
  }

  chatNamespace = io.of(NAMESPACE);

  chatNamespace.on('connection', function(socket) {
    var userId = helper.getUserId(socket);
    logger.info('New connection on %s by user %s', NAMESPACE, userId);

    socket.on('subscribe', function(room) {
      logger.info('Joining chat channel', room);
      socket.join(room);

      socket.on('unsubscribe', function(room) {
        logger.info('Leaving chat channel', room);
        socket.leave(room);
      });

      socket.on('message', function(data) {
        data.date = Date.now();
        data.room = room;
        localPubsub.topic(MESSAGE_RECEIVED).publish({room: room, message: data});
        globalPubsub.topic(MESSAGE_RECEIVED).publish({room: room, message: data});
      });
    });

    initialized = true;
  });

  globalPubsub.topic(USER_STATE).subscribe(function(data) {
    chatNamespace.emit(USER_STATE, data);
  });

  globalPubsub.topic(CHANNEL_CREATION).subscribe(function(data) {
    chatNamespace.emit(CHANNEL_CREATION, data);
  });

  globalPubsub.topic(TOPIC_UPDATED).subscribe(function(data) {
    chatNamespace.emit(TOPIC_UPDATED, data);
  });

  globalPubsub.topic(MESSAGE_RECEIVED).subscribe(function(data) {
    sendMessage(data.room, data.message);
  });
}

module.exports.init = init;
