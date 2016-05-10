'use strict';

angular.module('linagora.esn.chat')
  .directive('chatApplicationMenu', function(applicationMenuTemplateBuilder) {
    return {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/chat', 'mdi-facebook-messenger', 'Chat')
    };
  })

  .directive('chatSidebar', function(localStorageService) {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/aside/sidebar.html',
      link: function(scope) {
        scope.toggleNotification = function() {
          var newState = !scope.isNotificationEnabled;
          localStorageService.getOrCreateInstance('linagora.esn.chat').setItem('isNotificationEnabled', newState.toString()).then(function() {
            scope.isNotificationEnabled = newState;
          });
        };
      }
    };
  })

  .directive('chatChannelItem', function() {
    return {
      restrict: 'E',
      scope: {
        item: '='
      },
      controller: function($scope, $rootScope, $q, _, CHAT_EVENTS, chatUserState, session) {
        $scope.allUsersConnected = true;
        var userToConnected = {};

        function computeIsConnected() {
          $scope.allUsersConnected = _(userToConnected).values().every();
        }

        session.ready.then(function(session) {
          var statesPromises = _.chain($scope.item.members)
            .reject({_id: session.user._id})
            .map(function(member) {
              return chatUserState.get(member._id).then(function(state) {
                userToConnected[member._id] = state !== 'disconnected';
              });
            });

          $q.all(statesPromises).then(computeIsConnected);

          var unbind = $rootScope.$on(CHAT_EVENTS.USER_CHANGE_STATE, function(event, data) {
            if (angular.isDefined(userToConnected[data.userId])) {
              userToConnected[data.userId] = data.state !== 'disconnected';
              computeIsConnected();
            }
          });

          $scope.$on('$destroy', unbind);
        });
      },
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

