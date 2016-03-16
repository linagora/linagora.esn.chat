'use strict';

angular.module('linagora.esn.chat')

  .controller('rootController', function($scope, $state, ChatConversationService) {
    ChatConversationService.getChannels().then(function(result) {
      $scope.conversations = result.data;
    });
  })
  .controller('chatController', function($scope, $stateParams, session, ChatService, ChatConversationService, ChatMessageAdapter, CHAT, chatScrollDown, _, headerService) {

    $scope.user = session.user;

    ChatConversationService.getChannels().then(function(result) {
      $scope.channel =  _.find(result.data, {_id: $stateParams.id}) || result.data[0];
      ChatConversationService.fetchMessages($scope.channel._id, {}).then(function(result) {
        $scope.messages = result;
        chatScrollDown();
      });
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

    headerService.subHeader.setInjection('conversation-subheader', $scope);
  })

  .controller('addChannelController', function($scope, $state, ChatConversationService, headerService) {
    $scope.addChannel = function() {
      var channel = {
        name: $scope.channel.name,
        topic: $scope.channel.topic || '',
        purpose: $scope.channel.purpose || ''
      };

      ChatConversationService.postChannels(channel).then(function(response) {
        $state.go('chat.channels-views', {id: response.data._id});
        $scope.conversations.push(response.data);
      });
    };

    headerService.subHeader.setInjection('conversation-subheader', $scope);
  });
