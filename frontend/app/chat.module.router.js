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
          isModuleActive: isModuleActive,
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
        onExit: function(chatConversationActionsService, chatLastConversationService, conversation) {
          chatConversationActionsService.unsetActive();
          chatLastConversationService.set(conversation._id);
        }
      })
      .state('chat.channels-views.attachments', {
        url: '/attachments',
        views: {
          'sidebar@chat.channels-views': {
            template: '<chat-conversation-sidebar-attachments-list/>'
          }
        }
      })
      .state('chat.channels-views.members', {
        url: '/members',
        views: {
          'sidebar@chat.channels-views': {
            template: '<chat-conversation-sidebar-members-list/>'
          }
        }
      })
      .state('chat.channels-views.stars', {
        url: '/stars',
        views: {
          'sidebar@chat.channels-views': {
            template: '<chat-conversation-sidebar-stars-list/>'
          }
        }
      })
      .state('chat.channels-views.member', {
        url: '/member/:memberId',
        views: {
          'sidebar@chat.channels-views': {
            template: '<chat-conversation-sidebar-member/>'
          }
        }
      })
      .state('chat.channels-views.summary', {
        url: '/summary',
        views: {
          'sidebar@chat.channels-views': {
            template: '<chat-conversation-sidebar-summary/>'
          }
        }
      })
      .state('chat.channels-views.members-add', {
        url: '/members/add',
        params: {
          conversation: null
        },
        views: {
          'main@chat': {
            template: '<chat-members-add/>'
          }
        }
      })
      .state('chat.direct-message-add', {
        url: '/directmessage/add',
        views: {
          'main@chat': {
            template: '<chat-conversation-create-direct-message/>'
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
          'full@chat': {
            template: '<chat-conversation-list/>'
          }
        }
      })
      .state('chat.launch', {
        url: '/launch/:userId',
        onEnter: function($stateParams, $state, chatLaunchConversationService) {
          chatLaunchConversationService.launch($stateParams.userId).catch(function() {
            $state.go('chat');
          });
        }
      });

    function isModuleActive($location, chatConfiguration) {
      return chatConfiguration.get('enabled', true).then(function(isEnabled) {
        if (!isEnabled) {
          $location.path('/');
        }
      }).catch(function() {
        $location.path('/');
      });
    }
  });
})();
