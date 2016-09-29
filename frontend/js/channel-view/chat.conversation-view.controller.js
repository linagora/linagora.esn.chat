(function() {
  /*eslint strict: [2, "function"]*/
  /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('chatConversationViewController', chatConversationViewController);

  chatConversationViewController.$inject = ['$scope', 'session', 'chatConversationService', 'chatConversationsService', 'CHAT_EVENTS', 'chatScrollService', 'chatLocalStateService', '$stateParams'];

  function chatConversationViewController($scope, session, chatConversationService, chatConversationsService, CHAT_EVENTS, chatScrollService, chatLocalStateService, $stateParams) {
    var self = this;

    self.chatLocalStateService = chatLocalStateService;
    self.user = session.user;
    self.messages = [];
    self.glued = true;
    self.newMessage = newMessage;
    self.updateTopic = updateTopic;
    chatLocalStateService.ready.then(whenReady);

    function addUniqId(message) {
      message._uniqId = message.creator._id + ':' + message.timestamps.creation  + '' + message.text;
    }

    function insertMessage(messages, message) {
      addUniqId(message);
      // chances are, the new message is the most recent
      // So we traverse the array starting by the end
      for (var i = messages.length - 1; i > -1; i--) {
        if (messages[i].timestamps.creation < message.timestamps.creation) {
          messages.splice(i + 1, 0, message);

          return;
        }
      }
      messages.unshift(message);
    }

    function newMessage(message) {
      insertMessage(self.messages, message);
      chatScrollService.scrollDown();
    }

    function updateTopic($data) {
      chatConversationsService.updateConversationTopic($data, chatLocalStateService.activeRoom._id);
    }

    function whenReady() {
      var channelId = $stateParams.id || chatLocalStateService.channels[0] && chatLocalStateService.channels[0]._id;

      if (channelId) {
        chatLocalStateService.setActive(channelId);
        chatConversationService.fetchMessages(channelId, {}).then(function(result) {
          result.forEach(addUniqId);
          self.messages = result || [];
          chatScrollService.scrollDown();
        });
      }

      $scope.$on('$destroy', function() {
        if (self.chatLocalStateService.activeRoom && self.chatLocalStateService.activeRoom._id === channelId) {
          chatLocalStateService.unsetActive();
        }
      });
    }

    [CHAT_EVENTS.TEXT_MESSAGE, CHAT_EVENTS.FILE_MESSAGE].forEach(function(eventReceived) {
      $scope.$on(eventReceived, function(event, message) {
        if (message.channel === self.chatLocalStateService.activeRoom._id) {
          self.newMessage(message);
        }
      });
    });
  }
})();
