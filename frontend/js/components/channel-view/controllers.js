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
        webNotification) {

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
      $rootScope.$broadcast(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, channel);
      var conversation = _.find($scope.channels, {_id: $scope.channel._id});
      conversation && (conversation.isNotRead = false);
      ChatConversationService.fetchMessages($scope.channel._id, {}).then(function(result) {
        $scope.messages = result;
        ChatScroll.scrollDown();
      });
    });

    $scope.notifyNewMessage = function(message) {
      var channel = $scope.channel;

      function canSendNotification() {
        return !$window.document.hasFocus() && !channel.isNotRead && $scope.isNotificationEnabled && message.user !== $scope.user._id;
      }

      if (canSendNotification()) {
        var channelName = channel.name || 'OpenPaas Chat';
        webNotification.showNotification('New message in ' + channelName, {
          body: message.text,
          icon: '/images/facebook-messenger.png',
          autoClose: 4000
        }, function onShow(err) {
          if (err) {
            $log.error('Unable to show notification: ' + err);
          }
        });
      }
    };

    $scope.newMessage = function(message) {
      $scope.notifyNewMessage(message);

      if (message.channel !== $scope.channel._id) {
        var channel = _.find($scope.channels.concat($scope.groups), {_id: message.channel});
        if (channel) {
          channel.isNotRead = true;
        }
      }

      ChatMessageAdapter.fromAPI(message).then(function(message) {
        $scope.messages.push(message);
        ChatScroll.scrollDown();
      });
    };

    $scope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(evt, message) {
      $scope.newMessage(message);
    });
  });
