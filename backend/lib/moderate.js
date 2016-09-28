'use strict';

let q = require('q');

module.exports = function(dependencies) {

  let logger = dependencies('logger');
  let userModerationModule = dependencies('user').moderation;
  let mongoose = dependencies('db').mongo.mongoose;
  let Conversation = mongoose.model('ChatConversation');
  let Message = mongoose.model('ChatMessage');

  function switchConversationModerate(value) {
    return function(user) {
      let defer = q.defer();

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
      let defer = q.defer();

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

  return {
    start,
    switchMessageModerate,
    switchConversationModerate
  };
};
