(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatUserState', chatUserState);

    chatUserState.$inject = ['$q', '$rootScope', 'CHAT_EVENTS', 'CHAT_NAMESPACE', 'ChatRestangular', 'session', 'livenotification'];

    function chatUserState($q, $rootScope, CHAT_EVENTS, CHAT_NAMESPACE, ChatRestangular, session, livenotification) {
      var cache = {};

      session.ready.then(function() {
        var sio = livenotification(CHAT_NAMESPACE);

        sio.on(CHAT_EVENTS.USER_CHANGE_STATE, function(data) {
          $rootScope.$broadcast(CHAT_EVENTS.USER_CHANGE_STATE, data);
          cache[data.userId] = data.state;
        });
      });

      return {
        get: get
      };

      ////////////

      function get(userId) {
        if (cache[userId]) {
          return $q.when(cache[userId]);
        }

        return ChatRestangular.one('state', userId).get().then(function(response) {
          var state = response.data.state;

          cache[userId] = state;

          return state;
        });
      }
    }
})();
