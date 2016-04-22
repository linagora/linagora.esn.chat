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

  .factory('listenChatWebsocket', function(
        $rootScope,
        session,
        _,
        livenotification,
        ChatConversationService,
        CHAT_NAMESPACE,
        CHAT_EVENTS) {
    return {
      initListener: function() {
        session.ready.then(function(session) {
          var sio = livenotification(CHAT_NAMESPACE);
          sio.on(CHAT_EVENTS.USER_CHANGE_STATE, function(data) {
            $rootScope.$broadcast(CHAT_EVENTS.USER_CHANGE_STATE, data);
          });
        });
      }
    };
  })

  .factory('userState', function($q, $rootScope, _, CHAT_EVENTS, ChatRestangular) {
    var cache = {};

    $rootScope.$on(CHAT_EVENTS.USER_CHANGE_STATE, function(event, data) {
      cache[data.userId] = data.state;
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
  });

