(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular.module('linagora.esn.chat')
    .directive('chatUserTyping', function(_, session, userUtils) {
      return {
        restrict: 'E',
        scope: true,
        templateUrl: '/chat/views/components/conversation-view/user-typing.html',
        link: function(scope) {

          session.ready.then(function(session) {
            scope.typing = {};
            /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
            scope.$on('chat:message:user_typing', function(evt, message) {
              scope.typing[message.creator._id] = message;

              scope.usersTyping = _.chain(scope.typing)
                .filter(function(message) {
                  return message.state && scope.chatLocalStateService.activeRoom._id === message.channel && message.creator._id !== session.user._id;
                })
                .map('creator')
                .map(userUtils.displayNameOf)
                .value();
            });
          });
        }
      };
    })

    .directive('chatFooter', function() {
      return {
        restrict: 'E',
        templateUrl: '/chat/views/components/conversation-view/channel-footer.html'
      };
    })

    .directive('chatMessage', function(session) {
      return {
        restrict: 'E',
        scope: {
          message: '='
        },
        templateUrl: '/chat/views/components/conversation-view/messages/message.html',
        controller: function($scope, $filter, $timeout, chatParseMention, chatScroll, conversationsService) {
          var parsedText = $filter('oembedImageFilter')($scope.message.text);

          parsedText = $filter('linky')(parsedText, '_blank');
          parsedText = $filter('esnEmoticonify')(parsedText, {class: 'chat-emoji'});
          parsedText = chatParseMention.chatParseMention(parsedText, $scope.message.user_mentions);
          $scope.parsed = {
            text: parsedText
          };
          $scope.displayFile = true;
          $scope.toggleFile = function() {
            $scope.displayFile = !$scope.displayFile;
          };
          conversationsService.getConversationNamePromise.then(function(getConversationName) {
            $scope.getConversationName = getConversationName;
          });
          session.ready.then(function(session) {
            $scope.user = session.user;
            $timeout(function() {
              chatScroll.scrollDown();
            });
          });
        }
      };
    })

    .directive('chatMessagesView', function(conversationsService) {
      return {
        restrict: 'E',
        scope: {
          conversation: '=',
          messages: '='
        },
        templateUrl: '/chat/views/components/conversation-view/messages-view.html',
        link: function(scope) {
          conversationsService.getConversationNamePromise.then(function(getConversationName) {
            scope.getConversationName = getConversationName;
          });
        }
      };
    })

    .directive('chatConversationView', function() {
      return {
        restrict: 'E',
        controller: 'conversationViewController',
        templateUrl: '/chat/views/components/conversation-view/conversation-view.html',
        scope: {
          displayTopic: '='
        }
      };
    })

    .directive('chatMessageCompose', function($log, $rootScope, deviceDetector, chatScroll, chatMessageService, KEY_CODE, chatHumanizeEntitiesLabel) {

      function isEventPrevented(event) {
        if ('isDefaultPrevented' in event) {
          return event.isDefaultPrevented();
        } else {
          return event.defaultPrevented;
        }
      }

      return {
        restrict: 'E',
        templateUrl: '/chat/views/components/conversation-view/messages/message-compose.html',
        link: function(scope, element) {
          chatMessageService.connect();
          var textarea = element.find('textarea').get(0);
          var timer = null;

          scope.typing = false;
          scope.text = '';

          function sendUserTyping(state) {
            var message = {
              state: state,
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

          scope.clickableEmoticon = function() {
            $rootScope.$broadcast('chat:message:emoticon', textareaAdapter());
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
            chatScroll.scrollDown();

            chatMessageService.sendMessage(message).then(function(result) {
              $log.debug('Message ACK', result);
            }, function(err) {
              $log.error('Error while sending message', err);
            });
          };

          scope.onFileSelect = function(files) {
            $log.debug('Sending message with attachments', files);
            chatMessageService.sendMessageWithAttachments(buildCurrentMessage(), files).then(function() {
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
        templateUrl: '/chat/views/components/conversation-view/messages/message-separation.html',
        controller: function($scope, moment) {
          $scope.sameDay = function(timestampDate1, timestampDate2) {
            return moment(timestampDate1, 'x').isSame(moment(timestampDate2, 'x'), 'day');
          };

          $scope.diffDate = function(timestamp) {
            var messageDate = moment(timestamp, 'x');
            var formatDate = [messageDate.year(), messageDate.month(), messageDate.date()];

            return moment().diff(formatDate, 'day');
          };

          $scope.formatDate = function(timestamp) {
            return moment(timestamp, 'x').format('Do MMMM');
          };
        }
      };
    });
})();
