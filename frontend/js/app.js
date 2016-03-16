'use strict';

angular.module('linagora.esn.chat', [
  'esn.router',
  'restangular',
  'esn.search',
  'esn.scroll',
  'esn.attendee',
  'esn.header',
  'esn.sidebar',
  'op.dynamicDirective',
  'esn.url',
  'angularMoment'
])
  .config(function($stateProvider, routeResolver) {
    $stateProvider
      .state('chat', {
        url: '/chat',
        templateUrl: '/chat/views/index',
        controller: 'rootController',
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
        url: '/channels/view',
        views: {
          'main@chat': {
            templateUrl: '/chat/views/channels/channel-view.html',
            controller: 'chatController'
          }
        }
      })
      .state('chat.channels-add', {
        url: '/channels/add',
        views: {
          'main@chat': {
            templateUrl: '/chat/views/channels/channel-add.html',
            controller: 'addChannelController'
          }
        }
      });
  })
  .config(function(dynamicDirectiveServiceProvider) {

    var chatItem = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-chat', {priority: 35});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', chatItem);
  });
