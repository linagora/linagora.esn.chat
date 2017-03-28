(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatMessageCompose', chatMessageCompose);

  function chatMessageCompose($log, $rootScope, deviceDetector, session, chatConversationsStoreService, chatScrollService, chatMessageService, KEY_CODE, chatHumanizeEntitiesLabel, chatComposerState) {
    var directive = {
      restrict: 'E',
      templateUrl: '/chat/app/conversation/compose/message-compose.html',
      link: link
    };

    return directive;

    ////////////

    function isEventPrevented(event) {
      if ('isDefaultPrevented' in event) {
        return event.isDefaultPrevented();
      }

      return event.defaultPrevented;
    }

    function link(scope, element) {
      var textarea = element.find('textarea').get(0);
      var timer = null;
      var currentRoomId = chatConversationsStoreService.activeRoom._id;

      scope.typing = false;
      scope.text = '';

      chatComposerState.getMessage(chatConversationsStoreService.activeRoom._id).then(function(message) {
        scope.text = message && message.text ? message.text : '';
      });

      scope.$on('$destroy', function() {
        chatComposerState.saveMessage(currentRoomId, {text: scope.text});
      });

      function sendUserTyping(state) {
        var message = {
          state: state,
          channel: chatConversationsStoreService.activeRoom._id,
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
          creator: session.user._id,
          channel: chatConversationsStoreService.activeRoom._id,
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

        if (chatScrollService.canScrollDown(message.channel)) {
          chatScrollService.scrollDown();
        }
        chatMessageService.sendMessage(message).then(function(result) {
          $log.debug('Message ACK', result);
        }, function(err) {
          $log.error('Error while sending message', err);
        });
      };
    }
  }
})();
