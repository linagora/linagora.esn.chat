'use strict';

angular.module('linagora.esn.chat')
  .controller('chatController', function($scope, session, ChatService, ChatConversationService, ChatMessageAdapter, CHAT, chatScrollDown) {

    $scope.user = session.user;

    ChatConversationService.getChannels().then(function(result) {
      $scope.channel = result.data[0];
    });

    ChatConversationService.fetchMessages({
      size: CHAT.DEFAULT_FETCH_SIZE
    }).then(function(result) {
      $scope.messages = result;
    });

    ChatConversationService.getChannels().then(function(result) {
      $scope.conversations = result.data;
    });

    $scope.newMessage = function(message) {
      ChatMessageAdapter.fromAPI(message).then(function(message) {
        $scope.messages.push(message);
        chatScrollDown();
      });
    };

    $scope.$on('chat:message:text', function(evt, message) {
      $scope.newMessage(message);
    });
  });
