'use strict';

angular.module('linagora.esn.chat')

  .controller('chatRootController', function($scope, $rootScope, channelsService, CHAT_EVENTS, chatNotification) {
    $scope.isNotificationEnabled = chatNotification.isEnabled();

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

  .controller('chatChannelSubheaderController', function($scope, $rootScope, CHAT_EVENTS, channelActive) {
    var unbind = $rootScope.$on(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, function(event, channel) {
      $scope.channel = channel;
      channelActive.setChannelId(channel._id);
    });

    $scope.$on('$destroy', unbind);
  });
