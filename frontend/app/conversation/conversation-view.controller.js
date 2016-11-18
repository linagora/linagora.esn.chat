(function() {
  /*eslint strict: [2, "function"]*/
  /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationViewController', ChatConversationViewController);

  ChatConversationViewController.$inject = ['$scope', '$q', 'session', 'chatConversationService', 'chatConversationsService', 'CHAT_EVENTS', 'CHAT', 'chatScrollService', 'chatLocalStateService', '$stateParams'];

  function ChatConversationViewController($scope, $q, session, chatConversationService, chatConversationsService, CHAT_EVENTS, CHAT, chatScrollService, chatLocalStateService, $stateParams) {
    var self = this;

    self.chatLocalStateService = chatLocalStateService;
    self.user = session.user;
    self.messages = [];
    self.glued = true;
    self.loadPreviousMessages = loadPreviousMessages;
    self.newMessage = newMessage;
    self.updateTopic = updateTopic;
    self.chatLocalStateService.ready.then(init);

    function addUniqId(message) {
      message._uniqId = message.creator._id + ':' + message.timestamps.creation  + '' + message.text;
    }

    function getConversationId() {
      return $stateParams.id || (self.chatLocalStateService.channels && self.chatLocalStateService.channels[0] && self.chatLocalStateService.channels[0]._id);
    }

    function getOlderMessageId() {
      return self.messages && self.messages[0] && self.messages[0]._id;
    }

    function newMessage(message) {
      addUniqId(message);
      // chances are, the new message is the most recent
      // So we traverse the array starting by the end
      for (var i = self.messages.length - 1; i > -1; i--) {
        if (self.messages[i].timestamps.creation < message.timestamps.creation) {
          self.messages.splice(i + 1, 0, message);

          return;
        }
      }
      self.messages.unshift(message);
    }

    function queueOlderMessages(messages, isFirstLoad) {
      if (isFirstLoad) {
        return messages.forEach(function(message) {
          addUniqId(message);
          self.messages.push(message);
        });
      }

      messages.reverse().forEach(function(message) {
        addUniqId(message);
        self.messages.unshift(message);
      });
    }

    function loadPreviousMessages(isFirstLoad) {
      isFirstLoad = isFirstLoad || false;
      var conversationId = getConversationId();
      var options = {limit: CHAT.DEFAULT_FETCH_SIZE};
      var older = getOlderMessageId();

      if (older) {
        options.before = older;
      }

      return chatConversationService.fetchMessages(conversationId, options).then(function(result) {
        queueOlderMessages(result, isFirstLoad);

        return self.messages;
      });
    }

    function scrollDown() {
      chatScrollService.scrollDown();
    }

    function updateTopic($data) {
      chatConversationsService.updateConversationTopic($data, self.chatLocalStateService.activeRoom._id);
    }

    function init() {
      var conversationId = getConversationId();

      if (conversationId) {
        self.chatLocalStateService.setActive(conversationId);
        loadPreviousMessages(true).then(scrollDown);
      }

      $scope.$on('$destroy', function() {
        if (self.chatLocalStateService.activeRoom && self.chatLocalStateService.activeRoom._id === conversationId) {
          self.chatLocalStateService.unsetActive();
        }
      });
    }

    [CHAT_EVENTS.TEXT_MESSAGE, CHAT_EVENTS.FILE_MESSAGE].forEach(function(eventReceived) {
      $scope.$on(eventReceived, function(event, message) {
        if (message.channel && message.channel === self.chatLocalStateService.activeRoom._id) {
          self.newMessage(message);
          scrollDown();
        }
      });
    });
  }
})();
