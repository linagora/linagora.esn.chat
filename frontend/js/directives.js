'use strict';

angular.module('linagora.esn.chat')
  .directive('applicationMenuChat', function(applicationMenuTemplateBuilder) {
    return {
      restrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/chat', 'mdi-facebook-messenger', 'Chat')
    };
  })

  .directive('chatUserTyping', function(_, $q, ChatMessageAdapter) {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: '/chat/views/partials/user-typing.html',
      link: function(scope) {

        scope.typing = {};
        scope.$on('chat:message:user_typing', function(evt, message) {
          scope.typing[message.user] = message.state;
          var areTyping = _.map(scope.typing, function(value, key) {
            if (value && scope.channel._id === message.channel) {
              return key;
            }
          }).filter(function(element) {
            return element !== undefined;
          });

          $q.all(areTyping.map(function(element) {
            return ChatMessageAdapter.getUser(element);
          })).then(function(results) {
            scope.usersTyping = results.map(function(result) {
              if (result.firstname || result.lastname) {
                return (result.firstname || '') + ' ' + (result.lastname || '');
              } else {
                return result.emails[0];
              }
            });
          });

        });
      }
    };
  })

  .directive('chatManager', function(ChatWSTransport, ChatService, session) {
    return {
      restrict: 'A',
      link: function(scope) {
        var transport = new ChatWSTransport({
          ns: '/chat',
          room: session.domain._id,
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

  .directive('chatSidebar', function(localStorageService) {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/partials/conversation-sidebar.html',
      link: function(scope) {
        scope.toggleNotification = function() {
          var newState = !scope.isNotificationEnabled;
          localStorageService.getOrCreateInstance('linagora.esn.chat').setItem('isNotificationEnabled', newState.toString()).then(function() {
            scope.isNotificationEnabled = newState;
          });
        }
      }
    };
  })

  .directive('chatFooter', function() {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/partials/conversation-footer.html'

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

  .directive('conversationSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/partials/subheader.html'
    };
  })

  .directive('channelView', function() {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/channels/channel-view.html'
    };
  })

  .directive('chatMessageCompose', function($log, deviceDetector, chatScrollDown) {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/partials/message-compose.html',
      link: function(scope, element) {

        var timer = null;

        scope.typing = false;
        scope.text = '';

        function sendUserTyping(state) {
          var message = {
            //id: 1,
            type: 'user_typing',
            state: state,
            user: scope.user._id,
            channel: scope.channel._id,
            date: Date.now()
          };

          scope.chatService.sendMessage(message).then(function(result) {
            $log.debug('Message ACK', result);
          }, function(err) {
            $log.error('Error while sending message', err);
          });
        }
        element.on('keydown', function(event) {
          if (!deviceDetector.isMobile() && event.keyCode === 13) {
            if (!event.shiftKey) {
              event.preventDefault();
              scope.sendMessage();
            }
          }
        });

        scope.onTextChanged = function() {
          if (!scope.typing) {
            sendUserTyping(true);
          }
          scope.typing = true;
          clearTimeout(timer);
          timer = setTimeout(function() {
            scope.typing = false;
            sendUserTyping(false);
          }, 2000);
        };

        scope.sendMessage = function() {
          if (!scope.text) {
            return;
          }

          var message = {
            //id: 1,
            type: 'text',
            text: scope.text,
            user: scope.user._id,
            channel: scope.channel._id,
            date: Date.now()
          };

          scope.newMessage(message);
          scope.text = '';

          // hack to reset autoSize
          $('textarea')[0].style.height = '56px';
          chatScrollDown();

          scope.chatService.sendMessage(message).then(function(result) {
            $log.debug('Message ACK', result);
          }, function(err) {
            $log.error('Error while sending message', err);
          });
        };
      }
    };
  });
