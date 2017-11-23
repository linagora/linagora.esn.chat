(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatConversationService', chatConversationService);

    function chatConversationService(ChatRestangular, esnCollaborationClientService, CHAT_OBJECT_TYPES) {
      var service = {
        addMember: addMember,
        archive: archive,
        create: create,
        fetchMessages: fetchMessages,
        fetchAttachments: fetchAttachments,
        get: get,
        getMessage: getMessage,
        getSummary: getSummary,
        join: join,
        leave: leave,
        list: list,
        listForCurrentUser: listForCurrentUser,
        markAsRead: markAsRead,
        remove: remove,
        update: update,
        updateTopic: updateTopic,
        getUserStarredMessages: getUserStarredMessages
      };

      return service;

      function _getBase(id) {
        return ChatRestangular.all('conversations').one(id);
      }

      function _stripResponse(response) {
        return ChatRestangular.stripRestangular(response.data);
      }

      function addMember(id, userId) {
        return _getBase(id).one('members').one(userId).doPUT();
      }

      function archive(id) {
        return _getBase(id).one('archive').doPOST();
      }

      function create(conversation) {
        return ChatRestangular.one('conversations').doPOST(conversation);
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

      function getSummary(id) {
        return _getBase(id).one('summary').get().then(_stripResponse);
      }

      function join(id, userId) {
        return esnCollaborationClientService.join(CHAT_OBJECT_TYPES.CONVERSATION, id, userId);
      }

      function leave(id, userId) {
        return esnCollaborationClientService.leave(CHAT_OBJECT_TYPES.CONVERSATION, id, userId);
      }

      function list(options) {
        return ChatRestangular.all('conversations').getList(options);
      }

      function listForCurrentUser() {
        return ChatRestangular.one('user').all('conversations').getList();
      }

      function markAsRead(id) {
        return _getBase(id).one('readed').doPOST();
      }

      function remove(id) {
        return _getBase(id).doDELETE();
      }

      function update(id, conversation) {
        return _getBase(id).doPUT(conversation);
      }

      function updateTopic(id, topic) {
        return _getBase(id).one('topic').doPUT({
          value: topic
        });
      }

      function getUserStarredMessages(options) {
        options = options || {};
        options.starred = true;

        return ChatRestangular.all('messages').getList(options);
      }
    }
})();
