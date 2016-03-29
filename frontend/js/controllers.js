'use strict';

angular.module('linagora.esn.chat')

  .controller('chatRootController', function($scope, ChatConversationService, localStorageService) {
    ChatConversationService.getChannels().then(function(result) {
      $scope.channels = result.data;
      var localForage = localStorageService.getOrCreateInstance('linagora.esn.chat');
      localForage.getItem('isNotificationEnabled').then(function(value) {
        if (value) {
          $scope.isNotificationEnabled = value === 'true';
        } else {
          localForage.setItem('isNotificationEnabled', 'true').then(function() {
            $scope.isNotificationEnabled = true;
          });
        }
      });
    });
  })

  .controller('chatController', function($log, $window, $scope, $stateParams, session, ChatService, ChatConversationService, ChatMessageAdapter, CHAT, ChatScroll, _, headerService, webNotification) {

    $scope.user = session.user;

    ChatConversationService.getChannels().then(function(result) {
      $scope.channel =  _.find(result.data, {_id: $stateParams.id}) || result.data[0];
      var conversation = _.find($scope.channels, {_id: $scope.channel._id});
      conversation && (conversation.isNotRead = false);
      ChatConversationService.fetchMessages($scope.channel._id, {}).then(function(result) {
        $scope.messages = result;
        ChatScroll.scrollDown();
      });
    });

    $scope.notifyNewMessage = function(message) {
      var channel = _.find($scope.channels, {_id: message.channel});

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
        _.find($scope.channels, {_id: message.channel}).isNotRead = true;
      }

      ChatMessageAdapter.fromAPI(message).then(function(message) {
        $scope.messages.push(message);
        ChatScroll.scrollDown();
      });
    };

    $scope.$on('chat:message:text', function(evt, message) {
      $scope.newMessage(message);
    });

    headerService.subHeader.setInjection('chat-channel-subheader', $scope);
  })

  .controller('chatAddChannelController', function($scope, $state, ChatConversationService, headerService) {
    $scope.addChannel = function() {
      var channel = {
        name: $scope.channel.name,
        topic: $scope.channel.topic || '',
        purpose: $scope.channel.purpose || '',
        isNotRead: false
      };

      ChatConversationService.postChannels(channel).then(function(response) {
        $state.go('chat.channels-views', {id: response.data._id});
        $scope.channels.push(response.data);
      });
    };

    headerService.subHeader.setInjection('chat-channel-subheader', $scope);
  });
