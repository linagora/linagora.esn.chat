'use strict';

angular.module('linagora.esn.chat')

  .controller('chatRootController', function($scope, $rootScope, channelsService, CHAT_EVENTS, localStorageService) {
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

    channelsService.getChannels().then(function(channels) {
      $scope.channels = channels;
    });

    channelsService.getGroups().then(function(groups) {
      $scope.groups = groups;
    });
  })

  .controller('chatAddChannelController', function($scope, $state, channelsService) {
    $scope.addChannel = function() {
      var channel = {
        name: $scope.channel.name,
        type: 'channel',
        topic: $scope.channel.topic || '',
        purpose: $scope.channel.purpose || '',
        isNotRead: false
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

  .controller('chatChannelSubheaderController', function($scope, $rootScope, CHAT_EVENTS) {
    var unbind = $rootScope.$on(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, function(event, channel) {
      $scope.channel = channel;
    });

    $scope.$on('$destroy', unbind);
  });
