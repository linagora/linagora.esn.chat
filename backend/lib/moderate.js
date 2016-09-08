'use strict';

var q = require('q');

module.exports = function(dependencies) {

  var mongoose = dependencies('db').mongo.mongoose;
  var logger = dependencies('logger');
  var userModerationModule = dependencies('user').moderation;

  var Conversation = mongoose.model('ChatConversation');
  var Message = mongoose.model('ChatMessage');

  function switchConversationModerate(value) {
    return function(user) {
      var defer = q.defer();
      Conversation.update({creator: user._id}, {$set: {moderate: value}}, {multi: true}).exec(function(err, updated) {
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
      var defer = q.defer();
      Message.update({creator: user._id}, {$set: {moderate: value}}, {multi: true}).exec(function(err, updated) {
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
    start: start,
    switchMessageModerate: switchMessageModerate,
    switchConversationModerate: switchConversationModerate
  };
};
