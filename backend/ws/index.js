'use strict';

var CONSTANTS = require('../lib/constants');
var initialized = false;
var NAMESPACE = CONSTANTS.WEBSOCKET.NAMESPACE;
var chatNamespace;

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
        localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).publish({room: room, message: data});
        sendMessage(room, data);
      });
    });

    initialized = true;
  });

  globalPubsub.topic('user:state').subscribe(function(data) {
    chatNamespace.emit('user:state', data);
  });
}

module.exports.init = init;
