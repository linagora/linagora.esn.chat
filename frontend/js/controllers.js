'use strict';

angular.module('linagora.esn.chat')
  .controller('chatController', function($scope, session, ChatService, CHAT) {

    $scope.user = session.user;

    ChatService.fetchMessages({
      size: CHAT.DEFAULT_FETCH_SIZE
    }).then(function(result) {
      $scope.messages = result;
    });

  });
