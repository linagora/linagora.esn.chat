(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatChannelItemController', ChatChannelItemController);

  function ChatChannelItemController($scope, $rootScope, $q, $filter, _, CHAT_EVENTS, CHAT_CONVERSATION_TYPE, chatParseMention, chatUserState, session, moment, userUtils, chatConversationNameService) {
    var self = this;

    self.CHAT_CONVERSATION_TYPE = CHAT_CONVERSATION_TYPE;
    self.channelState = self.channelState || 'chat.channels-views';
    self.allUsersConnected = true;
    self.name = chatConversationNameService.getName(self.item);

    var userToConnected = {};

    if (self.item.last_message) {
      self.numberOfDays = calcNumberOfDays(self.item.last_message);
      self.item.last_message.text = chatParseMention.chatParseMention(self.item.last_message.text, self.item.last_message.user_mentions, {skipLink: true});
      self.item.last_message.text = $filter('esnEmoticonify')(self.item.last_message.text, {class: 'chat-emoji'});
    }

    session.ready.then(init);

    function calcNumberOfDays(last_message) {
      var d1 = moment().startOf('day');
      var d2 = moment(last_message.date);
      var numberDay = moment.duration(d1.diff(d2)).asDays() + 1;

      return parseInt(numberDay, 10);
    }

    function computeIsConnected() {
      self.allUsersConnected = _(userToConnected).values().every();
    }

    function setLastMessageIsMe(message) {
      self.lastMessageIsMe = message.creator._id === session.user._id;
      if (!self.lastMessageIsMe) {
        self.lastMessageDisplayName = userUtils.displayNameOf(message.creator);
      }
    }

    function init() {
      self.otherUsers = _.reject(self.item.members, {_id: session.user._id});
      if (self.otherUsers.length > 1) {
        self.conversationName = self.item.name || _.map(self.otherUsers, 'firstname').join(', ');
      }

      if (self.item.last_message.creator) {
        setLastMessageIsMe(self.item.last_message);
      }

      var statesPromises = self.otherUsers.map(function(member) {
          return chatUserState.get(member._id).then(function(state) {
            userToConnected[member._id] = state !== 'disconnected';
          });
        });

      $q.all(statesPromises).then(computeIsConnected);

      var unbind = $rootScope.$on(CHAT_EVENTS.USER_CHANGE_STATE, function(event, data) {
        if (angular.isDefined(userToConnected[data.userId])) {
          userToConnected[data.userId] = data.state !== 'disconnected';
          computeIsConnected();
        }
      });

      $rootScope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
        setLastMessageIsMe(message);
        self.numberOfDays = calcNumberOfDays(message);
      });

      $scope.$on('$destroy', unbind);
    }
  }
})();
