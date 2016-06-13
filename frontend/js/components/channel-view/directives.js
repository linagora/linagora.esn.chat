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
            if (value && scope.chatLocalStateService.activeRoom._id === message.channel) {
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
      controller: 'channelViewController',
      templateUrl: '/chat/views/components/channel-view/channel-view.html'
    };
  })

  .directive('chatMessageCompose', function($log, $rootScope, deviceDetector, ChatScroll, chatMessageService) {

    function ChatMessageComposeController() {
      var self = this;
      var eventInterceptors = [];

      self.addEventInterceptor = function(callback) {
        eventInterceptors.push(callback);
        return function removeEventInterceptor() {
          var cbIdx = eventInterceptors.indexOf(callback);
          if (cbIdx >= 0) {
            eventInterceptors.splice(cbIdx, 1);
          }
        };
      };
      self.shouldBypassEvent = function(evt) {
        return eventInterceptors.some(function(callback) {
          return callback(evt);
        });
      };
    }

    return {
      restrict: 'E',
      controller: ChatMessageComposeController,
      templateUrl: '/chat/views/components/channel-view/messages/message-compose.html',
      require: 'chatMessageCompose',
      link: function(scope, element, attrs, ctlr) {
        chatMessageService.connect();
        var textarea = element.find('textarea').get(0);
        var timer = null;

        scope.typing = false;
        scope.text = '';

        function sendUserTyping(state) {
          var message = {
            state: state,
            user: scope.user._id,
            channel: scope.chatLocalStateService.activeRoom._id,
            date: Date.now()
          };

          chatMessageService.sendUserTyping(message).then(function(result) {
            $log.debug('Message ACK', result);
          }, function(err) {
            $log.error('Error while sending message', err);
          });
        }

        function textareaAdapter() {
          return {
            value: scope.text,
            selectionStart: textarea.selectionStart,
            selectionEnd: textarea.selectionEnd,
            focus: function() {
              textarea.focus();
            },
            replaceText: function(value, selectionStart, selectionEnd) {
              scope.text = value;
              scope.$evalAsync(function() {
                textarea.focus();
                textarea.setSelectionRange(selectionStart, selectionEnd);
              });
            }
          };
        }

        element.on('keydown', function(event) {
          var bypassEvent = ctlr.shouldBypassEvent(event);

          if (!bypassEvent && !deviceDetector.isMobile() && event.keyCode === 13 && !event.shiftKey) {
            event.preventDefault();
            scope.sendMessage();
          }

          $rootScope.$broadcast('chat:message:compose:keydown', event);
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
          $rootScope.$broadcast('chat:message:compose:textChanged', textareaAdapter());
        };

        function buildCurrentMessage() {
          return {
            type: 'text',
            text: scope.text,
            user: scope.user._id,
            channel: scope.chatLocalStateService.activeRoom._id,
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
