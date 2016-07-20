'use strict';

angular.module('linagora.esn.chat')

  .factory('ChatRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/chat/api/chat');
      RestangularConfigurer.setFullResponse(true);
    });
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
    function fetchMessages(conversation, options) {
      return ChatRestangular.one(conversation).all('messages').getList(options).then(function(response) {
        return ChatRestangular.stripRestangular(response.data);
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

  .factory('chatNotification', function($rootScope, $window, $log, session, webNotification, localStorageService, CHAT_EVENTS, CHAT_NOTIF, conversationsService, chatLocalStateService) {
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
              webNotification.showNotification('New message in ' + channelName, {
                body: message.text,
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

  })

  .factory('chatLocalStateService', function($rootScope, $q, _, conversationsService, CHAT_CONVERSATION_TYPE, CHAT_EVENTS) {

    var service;

    function initLocalState() {
      $q.all([conversationsService.getChannels(), conversationsService.getPrivateConversations()]).then(function(result) {
        service.channels = result[0];
        service.privateConversations = result[1];
      });
      service.activeRoom = {};
    }

    function findConversation(channelId) {
      return _.find((service.channels || []).concat(service.privateConversations || []), {_id: channelId});
    }

    function isActiveRoom(channelId) {
      return channelId === service.activeRoom._id;
    }

    function setActive(channelId) {
      var channel;
      if (isActiveRoom(channelId)) {
        return true;
      }
      channel = findConversation(channelId);
      if (!channel) {
        return false;
      }
      channel.unreadMessageCount = 0;
      service.activeRoom = channel;

      $rootScope.$broadcast(CHAT_EVENTS.SWITCH_CURRENT_CHANNEL, channel);

      return true;
    }

    function unreadMessage(message) {
      var channel = findConversation(message.channel);
      if (channel && !isActiveRoom(channel._id)) {
        channel.unreadMessageCount = (channel.unreadMessageCount || 0) + 1;
      }
    }

    function addChannel(channel) {
      service.channels.push(channel);
    }

    function addPrivateConversation(privateConversation) {
      if (!findConversation(privateConversation._id)) {
        service.privateConversations.push(privateConversation);
      }
    }

    service = {
      setActive: setActive,
      unreadMessage: unreadMessage,
      initLocalState: initLocalState,
      findConversation: findConversation,
      isActiveRoom: isActiveRoom,
      addChannel: addChannel,
      addPrivateConversation: addPrivateConversation,
      channels: [],
      privateConversations: [],
      activeRoom: {}
    };

    return service;
  });
