(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular.module('linagora.esn.chat')
    .directive('chatApplicationMenu', function(applicationMenuTemplateBuilder) {
      return {
        restrict: 'E',
        replace: true,
        template: applicationMenuTemplateBuilder('/#/chat', 'mdi-facebook-messenger', 'Chat')
      };
    })

    .directive('chatSidebar', function(chatNotificationService) {
      return {
        restrict: 'E',
        templateUrl: '/chat/views/aside/sidebar.html',
        link: function(scope) {
          scope.toggleNotification = function() {
            var enable = chatNotificationService.isEnabled();

            chatNotificationService.setNotificationStatus(!enable);
            scope.isNotificationEnabled = !enable;
          };
        }
      };
    })

    .directive('chatConversationList', function() {
      return {
        restrict: 'E',
        templateUrl: '/chat/views/conversation-list.html',
        scope: {
          channelState: '@',
          types: '='
        },
        controller: function($scope, chatLocalStateService) {
          $scope.wanted = function(conversation) {
            return $scope.types.indexOf(conversation.type) > -1;
          };

          $scope.groups = chatLocalStateService.conversations;

          $scope.hasWantedConversation = function() {
            return $scope.groups.some(function(group) {
              return $scope.wanted(group);
            });
          };
        }
      };
    })

    .directive('chatConversationOverview', function() {
      return {
        restrict: 'E',
        scope: {
          item: '=',
          channelState: '=?'
        },
        controller: 'chatConversationItemController',
        templateUrl: '/chat/views/group-overview.html'
      };
    })

    .directive('chatConversationImage', function() {
      return {
        restrict: 'E',
        scope: {
          conversation: '='
        },
        controller: function($scope, session, _) {
          session.ready.then(function(session) {
            $scope.getMembers = function() {
              var members = $scope.conversation && $scope.conversation.members ? $scope.conversation.members : [];

              members = members.length === 1 ? members : _.reject(members, {_id: session.user._id});

              return members.slice(0, 4);
            };
          });
        },
        templateUrl: '/chat/views/conversation-image.html'
      };
    })

    .directive('chatConversationItem', function() {
      return {
        restrict: 'E',
        scope: {
          item: '=',
          channelState: '=?'
        },
        controller: 'chatConversationItemController',
        templateUrl: '/chat/views/aside/conversation-item.html'
      };
    })

    .directive('chatConversationSubheader', function() {
      return {
        restrict: 'E',
        scope: true,
        templateUrl: '/chat/views/subheaders/channel.html',
        controller: 'chatConversationSubheaderController'
      };
    });
})();
