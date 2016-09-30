'use strict';
/*eslint no-unused-vars: ["error", {"args": "after-used"}]*/

angular.module('linagora.esn.chat')

  .factory('ChatRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/chat/api/chat');
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('chatUserState', function($q, $rootScope, CHAT_EVENTS, CHAT_NAMESPACE, ChatRestangular, session, livenotification) {
    var cache = {};

    session.ready.then(function() {
      var sio = livenotification(CHAT_NAMESPACE);

      sio.on(CHAT_EVENTS.USER_CHANGE_STATE, function(data) {
        $rootScope.$broadcast(CHAT_EVENTS.USER_CHANGE_STATE, data);
        cache[data.userId] = data.state;
      });
    });

    return {
      get: function(userId) {
        if (cache[userId]) {
          return $q.when(cache[userId]);
        }

        return ChatRestangular.one('state', userId).get().then(function(response) {
          var state = response.data.state;

          cache[userId] = state;

          return state;
        });
      }
    };
  })

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

  .factory('ChatScroll', function(elementScrollService) {

    function scrollDown() {
      elementScrollService.autoScrollDown($('.ms-body .lv-body'));
    }

    return {
      scrollDown: scrollDown
    };
  })

  .factory('chatNotification', function($rootScope, $window, $log, session, webNotification, localStorageService, CHAT_EVENTS, CHAT_NOTIF, conversationsService, chatParseMention) {
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
          conversationsService.getConversation(message.channel).then(function(channel) {
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
