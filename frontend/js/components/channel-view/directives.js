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
          scope.typing[message.creator] = message.state;
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
      templateUrl: '/chat/views/components/channel-view/messages/message.html',
      controller: function($scope, $filter, chatParseMention) {
        var parsedText = $filter('linky')($scope.message.text, '_blank');
        parsedText = $filter('esnEmoticonify')(parsedText, {class: 'chat-emoji'});
        parsedText = chatParseMention(parsedText, $scope.message.user_mentions);
        $scope.parsed = {
          text: parsedText
        };
      }
    };
  })

  .directive('chatChannelView', function() {
    return {
      restrict: 'E',
      controller: 'channelViewController',
      templateUrl: '/chat/views/components/channel-view/channel-view.html'
    };
  })

  .directive('chatMessageCompose', function($log, $rootScope, deviceDetector, ChatScroll, chatMessageService, KEY_CODE, chatHumanizeEntitiesLabel) {

    function isEventPrevented(event) {
      if ('isDefaultPrevented' in event) {
        return event.isDefaultPrevented();
      } else {
        return event.defaultPrevented;
      }
    }

    return {
      restrict: 'E',
      templateUrl: '/chat/views/components/channel-view/messages/message-compose.html',
      link: function(scope, element, attrs) {
        chatMessageService.connect();
        var textarea = element.find('textarea').get(0);
        var timer = null;

        scope.typing = false;
        scope.text = '';

        function sendUserTyping(state) {
          var message = {
            state: state,
            creator: scope.user._id,
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
          $rootScope.$broadcast('chat:message:compose:keydown', event);

          var keyCode = event.keyCode || event.which || 0;

          if (!isEventPrevented(event) && !deviceDetector.isMobile() && keyCode === KEY_CODE.ENTER && !event.shiftKey) {
            if (!event.ctrlKey) {
              event.preventDefault();
              scope.sendMessage();
            } else {
              textarea.value = textarea.value + '\n';
              textarea.scrollTop = textarea.scrollHeight;
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
          $rootScope.$broadcast('chat:message:compose:textChanged', textareaAdapter());
        };

        function buildCurrentMessage() {
          return {
            type: 'text',
            text: chatHumanizeEntitiesLabel.replaceHumanPresentationByRealData(scope.text),
            creator: scope.user._id,
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

          scope.text = '';
          chatHumanizeEntitiesLabel.reset();

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
  })

  .directive('chatMessageSeparator', function() {
    return {
      restrict: 'E',
      scope: {
        prevMessage: '=?',
        currentMessage: '='
      },
      templateUrl: '/chat/views/components/channel-view/messages/message-separation.html',
      controller: function($scope, moment) {
        $scope.sameDay = function(date1, date2) {
          return moment(date1).isSame(date2, 'day');
        };

        $scope.diffDate = function(date) {
          return moment().diff(date, 'day');
        };

        $scope.formatDate = function(date) {
          return moment(date).format('MMMM Do');
        };
      }
    };
  });
