'use strict';

angular.module('linagora.esn.chat')

  .controller('chatRootController', function($scope, $rootScope, ChatConversationService, CHAT_EVENTS, localStorageService) {
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

    ChatConversationService.getChannels().then(function(channels) {
      $scope.channels = channels;
    });

    ChatConversationService.getGroups().then(function(groups) {
      $scope.groups = groups;
    });

    var unbind = $rootScope.$on(CHAT_EVENTS.NEW_CHANNEL, function(event, channel) {
      (channel.type === 'group' ? $scope.groups : $scope.channels).push(channel);
    });

    $scope.$on('$destroy', unbind);
  })

  .controller('chatController', function(
        $scope,
        $window,
        $log,
        $stateParams,
        $rootScope,
        session,
        ChatService,
        ChatConversationService,
        ChatMessageAdapter,
        CHAT,
        CHAT_EVENTS,
        ChatScroll,
        _,
        webNotification) {

    $scope.user = session.user;

    function getChannel() {
      if ($stateParams.id) {
        return ChatConversationService.getChannel($stateParams.id);
      } else {
        return ChatConversationService.getChannels().then(function(channels) {
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

    var unbind = $scope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(evt, message) {
      $scope.newMessage(message);
    });

    $scope.$on('$destroy', function() {
      unbind();
    });
  })

  .controller('chatAddChannelController', function($scope, $state, ChatConversationService) {
    $scope.addChannel = function() {
      var channel = {
        name: $scope.channel.name,
        type: 'channel',
        topic: $scope.channel.topic || '',
        purpose: $scope.channel.purpose || '',
        isNotRead: false
      };

      ChatConversationService.postChannels(channel).then(function(response) {
        $state.go('chat.channels-views', {id: response.data._id});
      });
    };
  })

  .controller('chatAddGroupController', function($scope, $state, ChatConversationService, _) {
    $scope.members = [];
    $scope.addGroup = function() {
      var group = {
        members: _.map($scope.members, '_id'),
        type: 'group'
      };

      ChatConversationService.postChannels(group).then(function(response) {
        $state.go('chat.channels-views', { id: response.data._id});
      });
    };
  })

  .controller('chatChannelSubheaderController', function($scope, $rootScope, CHAT_EVENTS) {
    var unbind = $rootScope.$on(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, function(event, channel) {
      $scope.channel = channel;
    });

    $scope.$on('$destroy', unbind);
  });
