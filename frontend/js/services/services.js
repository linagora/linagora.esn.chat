'use strict';

angular.module('linagora.esn.chat')

  .factory('ChatRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/chat/api/chat');
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('ChatMessageAdapter', function($q, userAPI) {

    var cache = {};

    function getUser(id) {
      if (cache[id]) {
        return $q.when(cache[id]);
      }

      return userAPI.user(id).then(function(response) {
        cache[id] = response.data;
        return response.data;
      });
    }

    function fromAPI(message) {
      if (message.user) {
        return getUser(message.user).then(function(user) {
          message.user = user;
          return message;
        });
      }

      return $q.when(message);
    }

    return {
      fromAPI: fromAPI,
      getUser: getUser
    };
  })

  .factory('chatUserState', function($q, $rootScope, _, CHAT_EVENTS, CHAT_NAMESPACE, ChatRestangular, session, livenotification) {
    var cache = {};

    session.ready.then(function(session) {
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

  .factory('ChatConversationService', function($q, session, ChatRestangular, _) {
    function fetchMessages(channel, options) {
      return ChatRestangular.one(channel).all('messages').getList(options).then(function(response) {
        return response.data.map(function(message) {
          message.user = message.creator;
          message.date = message.timestamps.creation;
          return message;
        });
      });
    }

    return {
      fetchMessages: fetchMessages
    };
  })

  .factory('ChatScroll', function($timeout, elementScrollService) {

    function scrollDown() {
      elementScrollService.autoScrollDown($('.ms-body .lv-body'));
    }

    return {
      scrollDown: scrollDown
    };
  })

  .factory('chatNotification', function($rootScope, $window, $log, session, webNotification, localStorageService, CHAT_EVENTS, CHAT_NOTIF, channelsService) {
    var enable, _channel, _message;
    var localForage = localStorageService.getOrCreateInstance('linagora.esn.chat');

    var initLocalPermission = function() {
      localForage.getItem('isNotificationEnabled').then(function(value) {
        if (value) {
          enable = value;
        } else {
          localForage.setItem('isNotificationEnabled', webNotification.permissionGranted);
          enable = webNotification.permissionGranted;
        }
      });
    };

    var canSendNotification = function() {
      return !$window.document.hasFocus() && !_channel.isNotRead && enable && _message.user !== session.user._id;
    };

    return {
      start: function() {
        initLocalPermission();
        $rootScope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
          channelsService.getChannel(message.channel).then(function(channel) {
            _channel = channel;
            _message = message;
            if (canSendNotification()) {
              var channelName = channel.name || 'OpenPaas Chat';
              webNotification.showNotification('New message in ' + channelName, {
                body: message.text,
                icon: CHAT_NOTIF.CHAT_DEFAULT_ICON,
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
        localForage.setItem('isNotificationEnabled', status);
        enable = status;
      }
    };

  })

  .factory('channelActive', function() {
    var channelId;
    return {
      setChannelId: function(_channelId) {
        channelId = _channelId;
      },
      getChannelId: function() {
        return channelId;
      }
    };
  });
