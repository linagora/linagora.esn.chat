(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular.module('linagora.esn.chat')
  .config(function($stateProvider, routeResolver) {
    $stateProvider
      .state('chat', {
        url: '/chat',
        templateUrl: '/chat/app/index.html',
        controller: 'ChatRootController',
        controllerAs: 'root',
        resolve: {
          domain: routeResolver.session('domain'),
          user: routeResolver.session('user')
        },
        deepStateRedirect: {
          default: 'chat.channels-views',
          fn: function() {
            return { state: 'chat.channels-views' };
          }
        }
      })
      .state('chat.channels-views', {
        url: '/channels/view/:id',
        views: {
          'main@chat': {
            template: '<sub-header><chat-conversation-subheader/></sub-header><chat-conversation-view/>'
          }
        }
      })
      .state('chat.groups-add', {
        url: '/groups/add',
        views: {
          'main@chat': {
            templateUrl: '/chat/app/group/add-group.html',
            controller: 'ChatAddGroupController',
            controllerAs: 'vm'
          }
        }
      })
      .state('chat.channels-add', {
        url: '/channels/add',
        views: {
          'main@chat': {
            templateUrl: '/chat/app/channel/add-channel.html',
            controller: 'ChatAddChannelController',
            controllerAs: 'vm'
          }
        }
      });
  });
})();
