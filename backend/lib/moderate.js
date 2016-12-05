'use strict';

const q = require('q');

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const userModerationModule = dependencies('user').moderation;
  const mongoose = dependencies('db').mongo.mongoose;
  const Conversation = mongoose.model('ChatConversation');
  const Message = mongoose.model('ChatMessage');

  return {
    start,
    switchMessageModerate,
    switchConversationModerate
  };

  function switchConversationModerate(value) {
    return function(user) {
      const defer = q.defer();

      Conversation.update({creator: user._id}, {$set: {moderate: value}}, {multi: true}).exec((err, updated) => {
        if (err) {
          logger.error('Error while switching moderate to %s on all conversation created by user %s', value, user._id, err);

          return defer.resolve(err);
        }
        defer.resolve(updated);
      });

      return defer.promise;
    };
  }

  function switchMessageModerate(value) {
    return function(user) {
      const defer = q.defer();

      Message.update({creator: user._id}, {$set: {moderate: value}}, {multi: true}).exec((err, updated) => {
        if (err) {
          logger.error('Error while switching moderate to %s on all message created by user %s', value, user._id, err);

          return defer.resolve(err);
        }
        defer.resolve(updated);
      });

      return defer.promise;
    };
  }

  function start() {
    userModerationModule.registerHandler('chat.conversation', {
      onUserDisabled: switchConversationModerate(true),
      onUserEnabled: switchConversationModerate(false)
    });

    userModerationModule.registerHandler('chat.message', {
      onUserDisabled: switchMessageModerate(true),
      onUserEnabled: switchMessageModerate(false)
    });
  }
};
