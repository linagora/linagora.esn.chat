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

  .factory('chatNotification', function($rootScope, $window, $log, session, webNotification, localStorageService, CHAT_EVENTS, CHAT_NOTIF, channelsService, chatLocalStateService) {
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
      return !$window.document.hasFocus() && enable && message.user !== session.user._id;
    };

    return {
      start: function() {
        initLocalPermission();
        $rootScope.$on(CHAT_EVENTS.TEXT_MESSAGE, function(event, message) {
          channelsService.getChannel(message.channel).then(function(channel) {
            if (canSendNotification(message)) {
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
        localForage.setItem('isNotificationEnabled', JSON.stringify(status));
        enable = status;
      }
    };

  })

  .factory('chatLocalStateService', function($rootScope, $q, _, channelsService, CHAT_CHANNEL_TYPE, CHAT_EVENTS) {

    var service;

    function initLocalState() {
      $q.all([channelsService.getChannels(), channelsService.getGroups()]).then(function(result) {
        service.channels = result[0];
        service.groups = result[1];
      });
      service.activeRoom = {};
    }

    function findChannel(channelId) {
      return _.find((service.channels || []).concat(service.groups || []), {_id: channelId});
    }

    function isActiveRoom(channelId) {
      return channelId === service.activeRoom._id;
    }

    function setActive(chatChannel) {
      var channel;
      if (isActiveRoom(chatChannel._id)) {
        return true;
      }
      channel = findChannel(chatChannel._id);
      if (!channel) {
        return false;
      }
      channel.unreadMessageCount = 0;
      service.activeRoom = channel;

      $rootScope.$broadcast(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, channel);

      return true;
    }

    function unreadMessage(message) {
      var channel = findChannel(message.channel);
      if (channel && !isActiveRoom(channel._id)) {
        channel.unreadMessageCount = (channel.unreadMessageCount || 0) + 1;
      }
    }

    service = {
      setActive: setActive,
      unreadMessage: unreadMessage,
      initLocalState: initLocalState,
      findChannel: findChannel,
      isActiveRoom: isActiveRoom,
      channels: [],
      groups: [],
      activeRoom: {}
    };

    return service;
  });
