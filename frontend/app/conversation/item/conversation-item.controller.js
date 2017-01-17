(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationItemController', ChatConversationItemController);

  function ChatConversationItemController($scope, $rootScope, $q, $filter, _, CHAT_EVENTS, CHAT_CONVERSATION_TYPE, chatParseMention, userStatusService, session, moment, userUtils, chatConversationNameService, chatLastConversationService) {
    var self = this;
    var userToConnected = {};

    self.connected = true;
    self.channelState = self.channelState || 'chat.channels-views';
    self.CHAT_CONVERSATION_TYPE = CHAT_CONVERSATION_TYPE;
    self.$onInit = $onInit;
    self.onConversationItemClicked = onConversationItemClicked;

    function getDaysSinceMessageCreated(message) {
      var d1 = moment().startOf('day');
      var d2 = moment(message.date);
      var numberDay = moment.duration(d1.diff(d2)).asDays() + 1;

      return parseInt(numberDay, 10);
    }

    function updateItemConnectedStatus() {
      self.connected = _(userToConnected).values().every();
    }

    function updateLastMessageInformation(message) {
      self.lastMessageIsMe = message.creator._id === session.user._id;
      if (!self.lastMessageIsMe) {
        self.lastMessageDisplayName = userUtils.displayNameOf(message.creator);
      }
    }

    function onConversationItemClicked(conversationId) {
      conversationId && chatLastConversationService.saveConversationId(session.user._id, {channelId: conversationId});
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

      var statesPromises = self.otherUsers.map(function(member) {
        return userStatusService.getCurrentStatus(member.member.id).then(function(status) {
          userToConnected[member.member.id] = status && (status.status !== 'disconnected');
        });
      });

      $q.all(statesPromises).then(updateItemConnectedStatus);

      var unbindUpdateState = $scope.$on(CHAT_EVENTS.USER_CHANGE_STATE, function(event, data) {
        if (angular.isDefined(userToConnected[data.userId])) {
          userToConnected[data.userId] = data.state !== 'disconnected';
          updateItemConnectedStatus();
        }
      });

      var unbindTextMessage = $scope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
        if (message.channel === self.conversation._id) {
          updateLastMessageInformation(message);
          self.numberOfDays = getDaysSinceMessageCreated(message);
        }
      });

      $scope.$on('$destroy', function() {
        unbindUpdateState();
        unbindTextMessage();
      });
    }
  }
})();
