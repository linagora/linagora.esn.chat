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
  'angularMoment',
  'matchMedia'
])
  .config(function($stateProvider, routeResolver) {
    $stateProvider.state('/chat', {
      url: '/chat',
      templateUrl: '/chat/views/index',
      controller: 'chatController',
      resolve: {
        domain: routeResolver.session('domain'),
        user: routeResolver.session('user')
      }
    });
  })
  .config(function(dynamicDirectiveServiceProvider) {

    var chatItem = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-chat', {priority: 35});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', chatItem);
  });
