'use strict';

angular.module('linagora.esn.chat')

  .controller('channelViewController', function(
        $scope,
        $window,
        $log,
        $rootScope,
        session,
        ChatConversationService,
        channelsService,
        ChatMessageAdapter,
        CHAT,
        CHAT_EVENTS,
        ChatScroll,
        _,
        webNotification,
        chatLocalStateService,
        $stateParams) {

    $scope.user = session.user;

    ChatConversationService.fetchMessages($scope.chatLocalStateService.activeRoom._id, {}).then(function(result) {
      $scope.messages = result;
      ChatScroll.scrollDown();
    });

    $scope.newMessage = function(message) {

      ChatMessageAdapter.fromAPI(message).then(function(message) {
        $scope.messages.push(message);
        ChatScroll.scrollDown();
      });
    };

    $scope.updateTopic = function($data) {
      channelsService.updateChannelTopic($data, chatLocalStateService.activeRoom._id);
    };

    $scope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
      if (message.channel === $scope.chatLocalStateService.activeRoom._id) {
        $scope.newMessage(message);
      } else {
        chatLocalStateService.unreadMessage(message);
      }
    });
  });
