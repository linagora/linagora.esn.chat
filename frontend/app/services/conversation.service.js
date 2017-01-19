(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationService', chatConversationService);

    function chatConversationService(ChatRestangular, collaborationAPI, CHAT_OBJECT_TYPES) {
      var service = {
        fetchMessages: fetchMessages,
        fetchAttachments: fetchAttachments,
        get: get,
        getMessage: getMessage,
        join: join,
        leave: leave
      };

      return service;

      function _getBase(id) {
        return ChatRestangular.all('conversations').one(id);
      }

      function _stripResponse(response) {
        return ChatRestangular.stripRestangular(response.data);
      }

      function fetchMessages(id, options) {
        return _getBase(id).all('messages').getList(options).then(_stripResponse);
      }

      function fetchAttachments(id, options) {
        return _getBase(id).all('attachments').getList(options);
      }

      function get(id) {
        return _getBase(id).get().then(_stripResponse);
      }

      function getMessage(id) {
        return _getBase(id).get().then(_stripResponse);
      }

      function join(id, userId) {
        return collaborationAPI.join(CHAT_OBJECT_TYPES.CONVERSATION, id, userId);
      }

      function leave(id, userId) {
        return collaborationAPI.leave(CHAT_OBJECT_TYPES.CONVERSATION, id, userId);
      }
    }
})();
