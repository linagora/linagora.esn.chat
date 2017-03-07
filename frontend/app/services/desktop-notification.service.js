(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatDesktopNotificationService', chatDesktopNotificationService);

    function chatDesktopNotificationService(
      $log,
      $rootScope,
      $window,
      localStorageService,
      session,
      webNotification,
      chatConversationMemberService,
      chatConversationsStoreService,
      chatParseMention,
      CHAT_LOCAL_STORAGE,
      CHAT_NOTIFICATION
    ) {
      var enable;
      var localForage = localStorageService.getOrCreateInstance('linagora.esn.chat');
      var service = {
        canNotify: canNotify,
        isEnabled: isEnabled,
        notify: notify,
        notifyMessage: notifyMessage,
        setNotificationStatus: setNotificationStatus,
        start: start
      };

      return service;

      ////////////

      function canNotify() {
        return !$window.document.hasFocus() && enable;
      }

      function canNotifyOnMessage(message) {
        return canNotify() && message.creator !== session.user._id;
      }

      function initLocalPermission() {
        localForage.getItem(CHAT_LOCAL_STORAGE.DESKTOP_NOTIFICATION)
          .then(function(value) {
            if (value) {
              enable = JSON.parse(value);
            } else {
              localForage.setItem(CHAT_LOCAL_STORAGE.DESKTOP_NOTIFICATION, JSON.stringify(webNotification.permissionGranted));
              enable = webNotification.permissionGranted;
            }
          }).catch(function(err) {
            $log.warn('Can not retrieve ' + CHAT_LOCAL_STORAGE.DESKTOP_NOTIFICATION + ' from localstorage', err);
            enable = false;
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

      function notifyMessage(message) {
        if (!canNotifyOnMessage(message)) {
          return;
        }

        var conversation = chatConversationsStoreService.find(message.channel);

        if (!conversation || !chatConversationMemberService.currentUserIsMemberOf(conversation)) {
          return;
        }

        var name = conversation.name || CHAT_NOTIFICATION.DEFAULT_TITLE;
        var parsedText = chatParseMention.parseMentions(message.text, message.user_mentions, {skipLink: true});

        return notify('New message in ' + name, {
          body: parsedText,
          icon: '/api/users/' + message.creator + '/profile/avatar'
        });
      }

      function setNotificationStatus(status) {
        localForage.setItem(CHAT_LOCAL_STORAGE.DESKTOP_NOTIFICATION, JSON.stringify(status));
        enable = status;
      }

      function start() {
        initLocalPermission();
      }
    }
})();
