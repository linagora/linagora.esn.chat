(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatBotMessageService', chatBotMessageService);

  function chatBotMessageService($q, CHAT_BOT) {
    var handlers = {};
    var defaultType = CHAT_BOT.MESSAGE_SUBTYPES.TEXT;
    var service = {
      register: register,
      resolve: resolve
    };

    return service;

    function register(type, handler) {
      handlers[type] = handler;
    }

    function resolve(type, message) {
      type = type || defaultType;
      if (!handlers[type]) {
        return $q.reject(new Error('Bot ' + type + ' subtype is not defined'));
      }

      return handlers[type](message);
    }
  }
})();
