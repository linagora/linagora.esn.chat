'use strict';

angular.module('linagora.esn.chat')

  .controller('chatRootController', function($scope, $rootScope, CHAT_EVENTS, chatNotification, chatLocalStateService) {
    $scope.isEnabled = function() {
      return chatNotification.isEnabled();
    };

    $scope.chatLocalStateService = chatLocalStateService;
    if (!chatLocalStateService.activeRoom._id) {
      chatLocalStateService.setActive(chatLocalStateService.channels[0]);
    }
  })

  .controller('chatAddChannelController', function($scope, $state, channelsService) {
    $scope.addChannel = function() {
      var channel = {
        name: $scope.channel.name,
        type: 'channel',
        topic: $scope.channel.topic || '',
        purpose: $scope.channel.purpose || ''
      };

      channelsService.addChannels(channel).then(function(response) {
        $state.go('chat.channels-views', {id: response.data._id});
      });
    };
  })

  .controller('chatAddGroupController', function($scope, $state, channelsService, _) {
    $scope.members = [];
    $scope.addGroup = function() {
      var group = {
        members: _.map($scope.members, '_id')
      };

      channelsService.addGroups(group).then(function(response) {
        $state.go('chat.channels-views', { id: response.data._id});
      });
    };
  })

  .controller('chatChannelSubheaderController', function() {
  });
