(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatNotificationService', chatNotificationService);

    function chatNotificationService($rootScope, $window, $log, session, webNotification, localStorageService, chatConversationActionsService, chatParseMention, CHAT_EVENTS, CHAT_NOTIFICATION) {
      var enable;
      var localForage = localStorageService.getOrCreateInstance('linagora.esn.chat');
      var service = {
        isEnabled: isEnabled,
        notify: notify,
        setNotificationStatus: setNotificationStatus,
        start: start
      };

      return service;

      ////////////

      function canSendNotification(message) {
        return !$window.document.hasFocus() && enable && message.creator !== session.user._id;
      }

      function initLocalPermission() {
        localForage.getItem('isNotificationEnabled').then(function(value) {
          if (value) {
            enable = JSON.parse(value);
          } else {
            localForage.setItem('isNotificationEnabled', JSON.stringify(webNotification.permissionGranted));
            enable = webNotification.permissionGranted;
          }
        });
      }

      function isEnabled() {
        return enable;
      }

      function notify(title, options, onShow) {
        options = options || {};
        options.icon = options.icon || CHAT_NOTIFICATION.DEFAULT_ICON;
        options.autoClose = options.autoClose || CHAT_NOTIFICATION.AUTO_CLOSE;
        onShow = onShow || function(err) {
          if (err) {
            err && $log.error('Unable to show notification: ' + err);
          }
        };

        webNotification.showNotification(title, options, onShow);
      }

      function setNotificationStatus(status) {
        localForage.setItem('isNotificationEnabled', JSON.stringify(status));
        enable = status;
      }

      function start() {
        initLocalPermission();
        $rootScope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
          chatConversationActionsService.getConversation(message.channel).then(function(channel) {
            if (canSendNotification(message)) {
              var channelName = channel.name || 'OpenPaas Chat';
              var parsedText = chatParseMention.parseMentions(message.text, message.user_mentions, {skipLink: true});

              webNotification.showNotification('New message in ' + channelName, {
                body: parsedText,
                icon: '/api/users/' + message.creator + '/profile/avatar',
                autoClose: CHAT_NOTIFICATION.AUTO_CLOSE
              }, function onShow(err) {
                if (err) {
                  err && $log.error('Unable to show notification: ' + err);
                }
              });
            }
          });
        });
      }
    }
})();
