'use strict';

angular.module('linagora.esn.chat')
  .directive('applicationMenuChat', function(applicationMenuTemplateBuilder) {
    return {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/chat', 'mdi-facebook-messenger', 'Chat')
    };
  })

  .directive('chatManager', function(ChatWSTransport, ChatService, session) {
    return {
      restrict: 'A',
      link: function(scope) {
        var transport = new ChatWSTransport({
          ns: '/chat',
          room: '123',
          user: session.user._id
        });

        var chat = new ChatService({
          user: session.user._id,
          transport: transport
        });

        chat.connect();

        scope.chatService = chat;
      }
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

  .directive('chatMessageCompose', function($log) {
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
            type: 'text',
            text: scope.text,
            user: scope.user._id,
            channel: scope.channel,
            date: Date.now()
          };

          scope.newMessage(message);
          scope.text = '';

          scope.chatService.sendMessage(message).then(function(result) {
            $log.debug('Message ACK', result);
          }, function(err) {
            $log.error('Error while sending message', err);
          });
        };
      }
    };
  });
