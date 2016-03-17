'use strict';

angular.module('linagora.esn.chat')

  .controller('rootChatController', function($scope, ChatConversationService) {
    ChatConversationService.getChannels().then(function(result) {
      $scope.conversations = result.data;
    });
  })
  .controller('chatController', function($window, $scope, $stateParams, session, ChatService, ChatConversationService, ChatMessageAdapter, CHAT, chatScrollDown, _, headerService, webNotification) {

    $scope.user = session.user;

    ChatConversationService.getChannels().then(function(result) {
      $scope.channel =  _.find(result.data, {_id: $stateParams.id}) || result.data[0];
      var conversation = _.find($scope.conversations, {_id: $scope.channel._id});
      conversation && (conversation.isNotRead = false);
      ChatConversationService.fetchMessages($scope.channel._id, {}).then(function(result) {
        $scope.messages = result;
        chatScrollDown();
      });
    });

    $scope.newMessage = function(message) {
      if (!$window.document.hasFocus() && message.user !== $scope.user._id) {
        var conversation = _.find($scope.conversations, {_id: message.channel});
        var channelName = conversation.name || 'OpenPaas Chat';
        webNotification.showNotification('New message in ' + channelName, {
          body: message.text,
          icon: '/images/facebook-messenger.png',
          autoClose: 4000
        }, function onShow(error, hide) {
          if (error) {
            console.log('Unable to show notification: ' + error.message);
          }
        });
      }

      if(message.channel !== $scope.channel._id) {
        _.find($scope.conversations, {_id: message.channel}).isNotRead = true;
      }
      ChatMessageAdapter.fromAPI(message).then(function(message) {
        $scope.messages.push(message);
        chatScrollDown();
      });
    };

    $scope.$on('chat:message:text', function(evt, message) {
      $scope.newMessage(message);
    });

    headerService.subHeader.setInjection('conversation-subheader', $scope);
  })

  .controller('addChannelController', function($scope, $state, ChatConversationService, headerService) {
    $scope.addChannel = function() {
      var channel = {
        name: $scope.channel.name,
        topic: $scope.channel.topic || '',
        purpose: $scope.channel.purpose || '',
        isNotRead: false
      };

      ChatConversationService.postChannels(channel).then(function(response) {
        $state.go('chat.channels-views', {id: response.data._id});
        $scope.conversations.push(response.data);
      });
    };

    headerService.subHeader.setInjection('conversation-subheader', $scope);
  });
