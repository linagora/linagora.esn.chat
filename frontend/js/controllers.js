'use strict';

angular.module('linagora.esn.chat')
  .controller('chatController', function($scope, session, ChatService, ChatConversationService, ChatMessageAdapter, CHAT) {

    $scope.user = session.user;

    ChatConversationService.fetchMessages({
      size: CHAT.DEFAULT_FETCH_SIZE
    }).then(function(result) {
      $scope.messages = result;
    });

    ChatConversationService.fetchHistory({
      size: CHAT.DEFAULT_FETCH_SIZE
    }).then(function(result) {
      $scope.conversations = result;
    });

    $scope.newMessage = function(message) {
      ChatMessageAdapter.fromAPI(message).then(function(message) {
        $scope.messages.push(message);
      });
    };

    $scope.$on('chat:message:text', function(evt, message) {
      $scope.newMessage(message);
    });
  });
