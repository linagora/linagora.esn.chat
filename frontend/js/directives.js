'use strict';

angular.module('linagora.esn.chat')
  .directive('chatApplicationMenu', function(applicationMenuTemplateBuilder) {
    return {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/chat', 'mdi-facebook-messenger', 'Chat')
    };
  })

  .directive('chatSidebar', function(chatNotification) {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/aside/sidebar.html',
      link: function(scope) {
        scope.toggleNotification = function() {
          var enable = chatNotification.isEnabled();
          chatNotification.setNotificationStatus(!enable);
          scope.isNotificationEnabled = !enable;
        };
      }
    };
  })

  .directive('chatConversationGroupList', function() {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/conversation-group-list.html',
      scope: {
        channelState: '@'
      },
      controller: function($scope, $state, chatLocalStateService) {
        $scope.groups = chatLocalStateService.groups;
      }
    };
  })

  .directive('chatGroupOverview', function() {
    return {
      restrict: 'E',
      scope: {
        item: '=',
        channelState: '=?'
      },
      controller: 'chatChannelItemController',
      templateUrl: '/chat/views/group-overview.html'
    };
  })

  .directive('chatChannelItem', function() {
    return {
      restrict: 'E',
      scope: {
        item: '=',
        channelState: '=?'
      },
      controller: 'chatChannelItemController',
      templateUrl: '/chat/views/aside/channel-item.html'
    };
  })

  .directive('chatChannelSubheader', function() {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: '/chat/views/subheaders/channel.html',
      controller: 'chatChannelSubheaderController'
    };
  });
