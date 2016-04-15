'use strict';

angular.module('linagora.esn.chat', [
  'esn.core',
  'esn.router',
  'restangular',
  'esn.search',
  'esn.scroll',
  'esn.attendee',
  'esn.header',
  'esn.sidebar',
  'op.dynamicDirective',
  'esn.url',
  'angularMoment',
  'esn.lodash-wrapper',
  'esn.oembed',
  'angular-web-notification',
  'esn.localstorage',
  'esn.file',
  'ui.router',
  'angularFileUpload'
])
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
            template: '<chat-channel-view>',
            controller: 'chatController'
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
  })
  .config(function(dynamicDirectiveServiceProvider) {
    var chatItem = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'chat-application-menu', {priority: 35});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', chatItem);
  });