(function() {
  /*eslint strict: [2, "function"]*/
  /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
  'use strict';

  angular.module('linagora.esn.chat')

    .factory('ChatConversationService', function(ChatRestangular) {
      function fetchMessages(conversation, options) {
        return ChatRestangular.one(conversation).all('messages').getList(options).then(function(response) {
          return ChatRestangular.stripRestangular(response.data);
        });
      }

      function getMessage(id) {
        return ChatRestangular.all('messages').one(id).get().then(function(response) {
          return ChatRestangular.stripRestangular(response.data);
        });
      }

      return {
        getMessage: getMessage,
        fetchMessages: fetchMessages
      };
    })

    .factory('chatNotification', function($rootScope, $window, $log, session, webNotification, localStorageService, CHAT_EVENTS, CHAT_NOTIF, chatConversationsService, chatParseMention) {
      var enable;
      var localForage = localStorageService.getOrCreateInstance('linagora.esn.chat');

      var initLocalPermission = function() {
        localForage.getItem('isNotificationEnabled').then(function(value) {
          if (value) {
            enable = JSON.parse(value);
          } else {
            localForage.setItem('isNotificationEnabled', JSON.stringify(webNotification.permissionGranted));
            enable = webNotification.permissionGranted;
          }
        });
      };

      var canSendNotification = function(message) {
        return !$window.document.hasFocus() && enable && message.creator !== session.user._id;
      };

      return {
        start: function() {
          initLocalPermission();
          $rootScope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
            chatConversationsService.getConversation(message.channel).then(function(channel) {
              if (canSendNotification(message)) {
                var channelName = channel.name || 'OpenPaas Chat';
                var parsedText = chatParseMention.chatParseMention(message.text, message.user_mentions, {skipLink: true});

                webNotification.showNotification('New message in ' + channelName, {
                  body: parsedText,
                  icon: '/api/users/' + message.creator + '/profile/avatar',
                  autoClose: CHAT_NOTIF.CHAT_AUTO_CLOSE
                }, function onShow(err) {
                  if (err) {
                    err && $log.error('Unable to show notification: ' + err);
                  }
                });
              }
            });
          });
        },
        isEnabled: function() {
          return enable;
        },
        setNotificationStatus: function(status) {
          localForage.setItem('isNotificationEnabled', JSON.stringify(status));
          enable = status;
        }
      };
    });
})();
