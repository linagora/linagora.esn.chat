'use strict';

var CONSTANTS = require('../lib/constants');
var initialized = false;
var NAMESPACE = CONSTANTS.WEBSOCKET.NAMESPACE;
var chatNamespace;
var USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
var CHANNEL_DELETION = CONSTANTS.NOTIFICATIONS.CHANNEL_DELETION;
var TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
var MESSAGE_RECEIVED = CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED;
var CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

function init(dependencies, lib) {
  var logger = dependencies('logger');
  var pubsub = dependencies('pubsub');
  var localPubsub = pubsub.local;
  var globalPubsub = pubsub.global;
  var io = dependencies('wsserver').io;
  var helper = dependencies('wsserver').ioHelper;

  function sendDataToConversation(conversation, type, data) {
    if (conversation.type === CONVERSATION_TYPE.PRIVATE) {
      conversation.members.forEach(function(user) {
        var sockets = helper.getUserSocketsFromNamespace(user._id, chatNamespace.sockets) || [];
        sockets.forEach(function(socket) {
          socket.emit(type, data);
        });
      });
    } else {
      chatNamespace.emit(type, data);
    }
  }

  function sendMessage(room, message) {
    lib.conversation.getConversation(message.channel, function(err, channel) {
      if (err) {
        logger.warn('Message sended to inexisting channel', message);
        return;
      }
      sendDataToConversation(channel, 'message', {room: room, data: message});
    });
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
        data.creator = helper.getUserId(socket);
        localPubsub.topic(MESSAGE_RECEIVED).publish({room: room, message: data});
      });
    });

    initialized = true;
  });

  globalPubsub.topic(USER_STATE).subscribe(function(data) {
    chatNamespace.emit(USER_STATE, data);
  });

  globalPubsub.topic(CHANNEL_CREATION).subscribe(function(data) {
    sendDataToConversation(data, CHANNEL_CREATION, data);
  });

  globalPubsub.topic(CHANNEL_DELETION).subscribe(function(data) {
    sendDataToConversation(data, CHANNEL_DELETION, data);
  });

  globalPubsub.topic(TOPIC_UPDATED).subscribe(function(data) {
    chatNamespace.emit(TOPIC_UPDATED, data);
  });

  globalPubsub.topic(MESSAGE_RECEIVED).subscribe(function(data) {
    sendMessage(data.room, data.message);
  });
}

module.exports.init = init;
