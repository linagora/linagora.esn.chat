(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationItemController', ChatConversationItemController);

  function ChatConversationItemController($scope, $rootScope, $q, $filter, _, CHAT_EVENTS, CHAT_CONVERSATION_TYPE, chatParseMention, userStatusService, session, moment, userUtils, chatConversationNameService) {
    var self = this;

    self.CHAT_CONVERSATION_TYPE = CHAT_CONVERSATION_TYPE;
    self.$onInit = $onInit;

    function getDaysSinceMessageCreated(message) {
      var d1 = moment().startOf('day');
      var d2 = moment(message.date);
      var numberDay = moment.duration(d1.diff(d2)).asDays() + 1;

      return parseInt(numberDay, 10);
    }

    function updateLastMessageInformation(message) {
      self.lastMessageIsMe = message.creator._id === session.user._id;
      if (!self.lastMessageIsMe) {
        self.lastMessageDisplayName = userUtils.displayNameOf(message.creator);
      }
    }

    function $onInit() {
      chatConversationNameService.getName(self.conversation).then(function(name) {
        self.name = name;
      });

      if (self.conversation.last_message) {
        self.numberOfDays = getDaysSinceMessageCreated(self.conversation.last_message);
        self.conversation.last_message.text = chatParseMention.parseMentions(self.conversation.last_message.text, self.conversation.last_message.user_mentions, {skipLink: true});
        self.conversation.last_message.text = $filter('esnEmoticonify')(self.conversation.last_message.text, {class: 'chat-emoji'});
      }

      if (self.conversation.last_message.creator) {
        updateLastMessageInformation(self.conversation.last_message);
      }

      self.otherUsers = _.reject(self.conversation.members, function(member) {
        return member.member.id === session.user._id;
      });

      var unbindTextMessage = $scope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
        if (message.channel === self.conversation._id) {
          updateLastMessageInformation(message);
          self.numberOfDays = getDaysSinceMessageCreated(message);
        }
      });

      $scope.$on('$destroy', function() {
        unbindTextMessage();
      });
    }
  }
})();
