'use strict';

angular.module('linagora.esn.chat')
  .controller('chatController', function($scope, session, ChatService, ChatConversationService, CHAT) {

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

  });
