(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatBotMessageNotMemberMentionHandler', chatBotMessageNotMemberMentionHandler);

  function chatBotMessageNotMemberMentionHandler($q, $filter, chatParseMention, CHAT_BOT) {
    var type = CHAT_BOT.MESSAGE_SUBTYPES.NOT_MEMBER_MENTION;

    var service = {
      type: type,
      setText: setText
    };

    return service;

    function setText(message) {
      message.text = message.user_mentions.map(function(user) {
        return '@' + user._id;
      }).join(', ');

      return chatParseMention.parseMentions(message.text, message.user_mentions);
    }
  }
})();
