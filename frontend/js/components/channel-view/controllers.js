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
        channelActive) {

    $scope.user = session.user;

    function getChannel() {
      if ($scope.channelId) {
        return channelsService.getChannel($scope.channelId);
      } else {
        return channelsService.getChannels().then(function(channels) {
          return channels[0];
        });
      }
    }

    getChannel().then(function(channel) {
      $scope.channel = channel;
      channelActive.setChannelId(channel._id);
      $scope.channel.isNotRead = false;
      $scope.channel.unreadMessageCount = 0;
      $rootScope.$broadcast(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, channel);
      var conversation = _.find($scope.channels, {_id: $scope.channel._id});
      conversation && (conversation.isNotRead = false);
      ChatConversationService.fetchMessages($scope.channel._id, {}).then(function(result) {
        $scope.messages = result;
        ChatScroll.scrollDown();
      });
    });

    $scope.newMessage = function(message) {

      ChatMessageAdapter.fromAPI(message).then(function(message) {
        $scope.messages.push(message);
        ChatScroll.scrollDown();
      });
    };

    $scope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
      if (message.channel !== channelActive.getChannelId()) {
        channelsService.unreadMessage(message);
      }
      $scope.newMessage(message);
    });
  });
