'use strict';

angular.module('linagora.esn.chat')

  .directive('chatUserTyping', function(_, $q, ChatMessageAdapter) {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: '/chat/views/components/channel-view/user-typing.html',
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

  .directive('chatFooter', function() {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/components/channel-view/channel-footer.html'
    };
  })

  .directive('chatMessage', function() {
    return {
      restrict: 'E',
      scope: {
        message: '='
      },
      templateUrl: '/chat/views/components/channel-view/messages/message.html'
    };
  })

  .directive('chatChannelView', function() {
    return {
      restrict: 'E',
      scope: {
        channelId: '=?'
      },
      controller: 'channelViewController',
      templateUrl: '/chat/views/components/channel-view/channel-view.html'
    };
  })

  .directive('chatMessageCompose', function($log, deviceDetector, ChatScroll, chatMessageService) {
    return {
      restrict: 'E',
      templateUrl: '/chat/views/components/channel-view/messages/message-compose.html',
      link: function(scope, element) {
        chatMessageService.connect();
        var timer = null;

        scope.typing = false;
        scope.text = '';

        function sendUserTyping(state) {
          var message = {
            state: state,
            user: scope.user._id,
            channel: scope.channel._id,
            date: Date.now()
          };

          chatMessageService.sendUserTyping(message).then(function(result) {
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

        function buildCurrentMessage() {
          return {
            type: 'text',
            text: scope.text,
            user: scope.user._id,
            channel: scope.channel._id,
            date: Date.now()
          };
        }

        scope.sendMessage = function() {
          if (!scope.text) {
            $log.debug('Can not send message');
            return;
          }

          var message = buildCurrentMessage();
          scope.newMessage(message);
          scope.text = '';

          // hack to reset autoSize
          $('textarea')[0].style.height = '56px';
          ChatScroll.scrollDown();

          chatMessageService.sendMessage(message).then(function(result) {
            $log.debug('Message ACK', result);
          }, function(err) {
            $log.error('Error while sending message', err);
          });
        };

        scope.onFileSelect = function(files) {
          $log.debug('Sending message with attachments', files);
          chatMessageService.sendMessageWithAttachments(buildCurrentMessage(), files).then(function(response) {
            scope.newMessage(response);
            scope.text = '';
          }, function(err) {
            $log.error('Error while uploading message', err);
          });
        };
      }
    };
  });
