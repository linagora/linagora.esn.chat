'use strict';

const Q = require('q');
const CONSTANTS = require('../../constants');

module.exports = function(dependencies, lib) {

  const localPubsub = dependencies('pubsub').local;
  const globalPubsub = dependencies('pubsub').global;
  const logger = dependencies('logger');
  const userModule = dependencies('user');

  const userSubscribedPrivateConversation = require('../../user-subscribed-private-conversation')(dependencies);

  const forwardHandlers = {};
  const messageHandlers = [];

  return {
    addForwardHandler,
    addHandler,
    handleMessage,
    start
  };

  function addForwardHandler(type, handler) {
    forwardHandlers[type] = handler;
  }

  function addHandler(handler) {
    handler && messageHandlers.push(handler);
  }

  function forwardMessage(message) {
    const handler = getForwardHandler(message.type);

    if (!handler) {
      return logger.error('Can not find a valid forward handler for message of type %s', message.type);
    }

    handler(message, (err, message) => {
      if (err) {
        return logger.error('Can not forward message', err);
      }

      publish({message});
    });
  }

  function getForwardHandler(type) {
    return forwardHandlers[type];
  }

  function handleMessage(data) {
    messageHandlers.map(handler => {
      try {
        handler(data);
      } catch (err) {
        logger.warn('Error while handling message', err);
      }
    });
  }

  function isForwardable(message) {
    return !!forwardHandlers[message.type];
  }

  function publish(event) {
    globalPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).publish(event);
  }

  function start() {
    addHandler(require('./handlers/first')(dependencies));
    addHandler(require('./handlers/mentions')(dependencies));
    addForwardHandler(CONSTANTS.MESSAGE_TYPE.USER_TYPING, require('./forward/user-typing')(dependencies));

    localPubsub.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(onMessageReceived);

    function onMessageReceived(data) {
      if (isForwardable(data.message)) {
        return forwardMessage(data.message);
      }

      return saveAsChatMessage(data).then(message => {
        logger.debug(`Chat Message saved ${message._id}`);
        publish({message});
        handleMessage({message});

        return Q(message);
      }).catch(err => {
        logger.error('Can not save message in conversation', err);

        return Q.reject(err);
      });
    }

    function saveAsChatMessage(data) {

      return Q.spread([getUser(), getConversation()], saveMessage);

      function getConversation() {
        const channelId = data.message.channel._id || data.message.channel;

        return Q.denodeify(lib.conversation.getById)(channelId).then(conversation => {
          if (!conversation) {
            return Q.reject(new Error(`No such conversation ${channelId}`));
          }

          return conversation;
        });
      }

      function getUser() {
        return Q.denodeify(userModule.get)(data.message.creator).then(user => {
          if (!user) {
            return Q.reject(new Error(`No such user ${data.message.creator}`));
          }

          return user;
        });
      }

      function saveMessage(user, conversation) {
        const defer = Q.defer();

        lib.conversation.permission.userCanWrite(user, conversation).then(writable => {
          if (!writable) {
            return defer.reject(new Error(`User ${user._id} can not write message in the conversation ${conversation._id}`));
          }

          const chatMessage = {
            type: data.message.type,
            subtype: data.message.subtype,
            text: data.message.text,
            date: data.message.date,
            creator: data.message.creator,
            channel: data.message.channel
          };

          if (data.message.attachments) {
            chatMessage.attachments = data.message.attachments;
          }

          lib.message.create(chatMessage, (err, createdMessage) => {
            if (err) {
              return defer.reject(err);
            }

            // Handle subscription to a private conversation when there is a sent direct message
            if (data.message.type === CONSTANTS.MESSAGE_TYPE.TEXT && conversation.type === CONSTANTS.CONVERSATION_TYPE.DIRECT_MESSAGE) {
              return membersSubscribeToPrivateConversation(conversation)
                .then(
                  () => defer.resolve(createdMessage),
                  err => defer.reject(err)
                );
            }

            defer.resolve(createdMessage);
          });

        }, err => {
          logger.error('Error while checking user write permission', err);

          defer.reject(new Error(`User ${user._id} can not write message in the conversation ${conversation._id}`));
        });

        return defer.promise;
      }

      function membersSubscribeToPrivateConversation(conversation) {
        const memberIds = conversation.members.map(member => String(member.member.id));

        return Q.all(
          memberIds.map(memberId => userSubscribedPrivateConversation.get(memberId)
            .then(doc => {
              const conversations = doc && doc.conversations ? doc.conversations : [];

              if (conversations.indexOf(conversation._id) === -1) {
                conversations.push(conversation._id);

                return userSubscribedPrivateConversation.store(memberId, conversations);
              }

              return;
            })
          ).filter(Boolean)
        );
      }
    }
  }
};
