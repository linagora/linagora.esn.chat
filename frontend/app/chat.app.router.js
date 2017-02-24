(function() {
  'use strict';

  angular.module('linagora.esn.chat')
  .config(function($stateProvider) {
    $stateProvider
      .state('chat', {
        url: '/chat',
        templateUrl: '/chat/app/index.html',
        deepStateRedirect: {
          default: 'chat.channels-views',
          fn: function() {
            return { state: 'chat.channels-views' };
          }
        },
        resolve: {
          ready: function($log, chatConversationActionsService) {
            // wait for all required data to be initialized resolving other sub states
            return chatConversationActionsService.ready.then(function() {
              $log.debug('Chat is ready');

              return;
            });
          }
        }
      })
      .state('chat.channels-views', {
        url: '/channels/view/:id',
        views: {
          'main@chat': {
            template: '<sub-header><chat-conversation-subheader/></sub-header><chat-conversation-view/>'
          }
        },
        resolve: {
          conversation: function($log, $state, $stateParams, chatConversationResolverService) {
            return chatConversationResolverService($stateParams.id)
              .catch(function(err) {
                $log.error('Error while resolving conversation', err.message);
                $state.go('home');
              });
          }
        },
        onEnter: function(chatConversationActionsService, conversation) {
          chatConversationActionsService.setActive(conversation);
        },
        onExit: function(chatLastConversationService, conversation) {
          chatLastConversationService.set(conversation._id);
        }
      })
      .state('chat.channels-views.attachments', {
        url: '/attachments',
        views: {
          'sidebar@chat.channels-views': {
            template: '<chat-conversation-sidebar-attachments/>'
          }
        }
      })
      .state('chat.channels-views.members', {
        url: '/members',
        views: {
          'sidebar@chat.channels-views': {
            template: '<chat-conversation-sidebar-members/>'
          }
        }
      })
      .state('chat.groups-add', {
        url: '/groups/add',
        views: {
          'main@chat': {
            template: '<chat-conversation-create-private/>'
          }
        }
      })
      .state('chat.channels-add', {
        url: '/channels/add',
        views: {
          'main@chat': {
            template: '<chat-conversation-create-channel/>'
          }
        }
      })
      .state('chat.channels-list', {
        url: '/channels/list',
        views: {
          'main@chat': {
            template: '<chat-conversation-list/>'
          }
        }
      });
  });
})();
