(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular.module('linagora.esn.chat')

    .controller('conversationViewController', function(
          $scope,
          session,
          chatConversationService,
          chatConversationsService,
          CHAT_EVENTS,
          chatScrollService,
          chatLocalStateService,
          $stateParams) {

      chatLocalStateService.ready.then(function() {
        var channelId = $stateParams.id || chatLocalStateService.channels[0] && chatLocalStateService.channels[0]._id;

        if (channelId) {
          chatLocalStateService.setActive(channelId);
          chatConversationService.fetchMessages(channelId, {}).then(function(result) {
            result.forEach(addUniqId);
            $scope.messages = result || [];
            chatScrollService.scrollDown();
          });
        }

        $scope.$on('$destroy', function() {
          if ($scope.chatLocalStateService.activeRoom && $scope.chatLocalStateService.activeRoom._id === channelId) {
            chatLocalStateService.unsetActive();
          }
        });
      });

      $scope.chatLocalStateService = chatLocalStateService;
      $scope.user = session.user;
      $scope.messages = [];
      $scope.glued = true;

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

      $scope.newMessage = function(message) {
        insertMessage($scope.messages, message);
        chatScrollService.scrollDown();
      };

      $scope.updateTopic = function($data) {
        chatConversationsService.updateConversationTopic($data, chatLocalStateService.activeRoom._id);
      };

      [CHAT_EVENTS.TEXT_MESSAGE, CHAT_EVENTS.FILE_MESSAGE].forEach(function(eventReceived) {
        /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
        $scope.$on(eventReceived, function(event, message) {
          if (message.channel === $scope.chatLocalStateService.activeRoom._id) {
            $scope.newMessage(message);
          }
        });
      });
    });
})();
