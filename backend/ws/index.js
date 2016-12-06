'use strict';

const CONSTANTS = require('../lib/constants');
const NAMESPACE = CONSTANTS.WEBSOCKET.NAMESPACE;
const USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
const CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
const CHANNEL_DELETION = CONSTANTS.NOTIFICATIONS.CHANNEL_DELETION;
const TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
const MESSAGE_RECEIVED = CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED;
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const ADD_MEMBERS_TO_CHANNEL = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
const CONVERSATION_UPDATE = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATE;
let initialized = false;
let chatNamespace;

function init(dependencies, lib) {
  const logger = dependencies('logger');
  const io = dependencies('wsserver').io;
  const helper = dependencies('wsserver').ioHelper;
  const pubsub = dependencies('pubsub');
  const localPubsub = pubsub.local;
  const globalPubsub = pubsub.global;

  if (initialized) {
    return logger.warn('The chat notification service is already initialized');
  }

  chatNamespace = io.of(NAMESPACE);
  chatNamespace.on('connection', socket => {
    const userId = helper.getUserId(socket);

    logger.info('New connection on %s by user %s', NAMESPACE, userId);

    socket.on('subscribe', room => {
      logger.info('Joining chat channel', room);
      socket.join(room);

      socket.on('unsubscribe', room => {
        logger.info('Leaving chat channel', room);
        socket.leave(room);
      });

      socket.on('message', message => {
        message.date = Date.now();
        message.room = room;
        message.creator = helper.getUserId(socket);
        localPubsub.topic(MESSAGE_RECEIVED).publish({room, message});
      });
    });

    initialized = true;
  });

  globalPubsub.topic(USER_STATE).subscribe(data => chatNamespace.emit(USER_STATE, data));
  globalPubsub.topic(CHANNEL_CREATION).subscribe(data => sendDataToConversation(data, CHANNEL_CREATION, data));
  globalPubsub.topic(CHANNEL_DELETION).subscribe(data => sendDataToConversation(data, CHANNEL_DELETION, data));
  globalPubsub.topic(TOPIC_UPDATED).subscribe(data => chatNamespace.emit(TOPIC_UPDATED, data));
  globalPubsub.topic(MESSAGE_RECEIVED).subscribe(data => sendMessage(data.room, data.message));
  globalPubsub.topic(ADD_MEMBERS_TO_CHANNEL).subscribe(data => sendDataToConversation(data, ADD_MEMBERS_TO_CHANNEL, data));
  globalPubsub.topic(CONVERSATION_UPDATE).subscribe(data => {
    const conversation = data.conversation;

    sendDataToConversation(conversation, CONVERSATION_UPDATE, conversation);
    if (data.deleteMembers) {
      sendDataToUsers(data.deleteMembers, CHANNEL_DELETION, conversation);
    }
  });

  function sendDataToUsers(users, type, data) {
    users.forEach(user => {
      const sockets = helper.getUserSocketsFromNamespace(user._id || user, chatNamespace.sockets) || [];

      sockets.forEach(socket => socket.emit(type, data));
    });
  }

  function sendDataToConversation(conversation, type, data) {
    if (conversation.type === CONVERSATION_TYPE.PRIVATE || conversation.type === CONVERSATION_TYPE.COLLABORATION) {
      sendDataToUsers(conversation.members, type, data);
    } else {
      chatNamespace.emit(type, data);
    }
  }

  function sendMessage(room, message) {
    lib.conversation.getById(message.channel, (err, channel) => {
      if (err) {
        return logger.error('Error while getting channel to send message', err);
      }

      if (!channel) {
        return logger.warn('Can not find channel to send message');
      }

      sendDataToConversation(channel, 'message', {room, data: message});
    });
  }
}

module.exports.init = init;
