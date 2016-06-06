'use strict';

angular.module('linagora.esn.chat')
.config(function($stateProvider, routeResolver) {
  $stateProvider
    .state('chat', {
      url: '/chat',
      templateUrl: '/chat/views/index',
      controller: 'chatRootController',
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
          template: '<sub-header><chat-channel-subheader/></sub-header><chat-channel-view/>',
          controller: function($stateParams, chatLocalStateService) {
            var channel = chatLocalStateService.findChannel($stateParams.id);
            if (channel) {
              chatLocalStateService.setActive(channel);
            } else {
              chatLocalStateService.setActive(chatLocalStateService.channels[0]);
            }
          },
          controllerAs: 'ctrl'
        }
      }
    })
    .state('chat.groups-add', {
      url: '/groups/add',
      views: {
        'main@chat': {
          templateUrl: '/chat/views/channels/group-add.html',
          controller: 'chatAddGroupController'
        }
      }
    })
    .state('chat.channels-add', {
      url: '/channels/add',
      views: {
        'main@chat': {
          templateUrl: '/chat/views/channels/channel-add.html',
          controller: 'chatAddChannelController'
        }
      }
    });
});
