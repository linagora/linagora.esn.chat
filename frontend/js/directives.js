'use strict';

angular.module('linagora.esn.chat')
  .directive('applicationMenuChat', function(applicationMenuTemplateBuilder) {
    return {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/chat', 'mdi-facebook-messenger', 'Chat')
    };
  })

  .directive('chatConversationItem', function() {
    return {
      restrict: 'E',
      scope: {
        item: '='
      },
      templateUrl: '/chat/views/partials/conversation-item.html'
    };
  })

  .directive('chatMessage', function() {
    return {
      restrict: 'E',
      scope: {
        message: '='
      },
      templateUrl: '/chat/views/partials/message.html'
    };
  })

  .directive('chatMessageCompose', function($log, ChatService) {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/partials/message-compose.html',
      link: function(scope) {
        scope.text = '';
        scope.sendMessage = function() {
          if (!scope.text) {
            return;
          }

          var message = {
            id: 1, // TODO: Unique ID
            text: scope.text,
            user: scope.user,
            channel: scope.channel,
            date: Date.now()
          };

          scope.messages.push(message);
          scope.text = '';

          ChatService.sendMessage(message).then(function(result) {
            $log.debug('Message ACK', result);
          }, function(err) {
            $log.error('Error while sending message', err);
          });
        };
      }
    };
  });
