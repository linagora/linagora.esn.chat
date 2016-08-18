'use strict';

angular.module('linagora.esn.chat')

  .controller('conversationViewController', function(
        $scope,
        $window,
        $log,
        $rootScope,
        session,
        ChatConversationService,
        conversationsService,
        CHAT,
        CHAT_EVENTS,
        ChatScroll,
        _,
        webNotification,
        chatLocalStateService,
        $stateParams) {

    $scope.chatLocalStateService = chatLocalStateService;
    $scope.user = session.user;
    $scope.messages = [];

    function addUniqId(message) {
      message._uniqId = message.creator._id + ':' + message.timestamps.creation  + '' + message.text;
    }

    ChatConversationService.fetchMessages(chatLocalStateService.activeRoom._id, {}).then(function(result) {
      result.forEach(addUniqId);
      $scope.messages = result || [];
      ChatScroll.scrollDown();
    });

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
      ChatScroll.scrollDown();
    };

    $scope.updateTopic = function($data) {
      conversationsService.updateConversationTopic($data, chatLocalStateService.activeRoom._id);
    };

    [CHAT_EVENTS.TEXT_MESSAGE, CHAT_EVENTS.FILE_MESSAGE].forEach(function(eventReceived) {
      $scope.$on(eventReceived, function(event, message) {
        if (message.channel === $scope.chatLocalStateService.activeRoom._id) {
          $scope.newMessage(message);
        }
      });
    });

    $scope.$on('$destroy', chatLocalStateService.unsetActive);
  });
