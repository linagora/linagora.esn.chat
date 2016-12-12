(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatMessageCompose', chatMessageCompose);

  chatMessageCompose.$inject = ['$log', '$rootScope', 'deviceDetector', 'session', 'chatLocalStateService', 'chatScrollService', 'chatMessageService', 'KEY_CODE', 'chatHumanizeEntitiesLabel'];

  function chatMessageCompose($log, $rootScope, deviceDetector, session, chatLocalStateService, chatScrollService, chatMessageService, KEY_CODE, chatHumanizeEntitiesLabel) {
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
      chatMessageService.connect();
      var textarea = element.find('textarea').get(0);
      var timer = null;

      scope.typing = false;
      scope.text = '';

      function sendUserTyping(state) {
        var message = {
          state: state,
          channel: chatLocalStateService.activeRoom._id,
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
          channel: chatLocalStateService.activeRoom._id,
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
        chatScrollService.scrollDown();

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
  }
})();
