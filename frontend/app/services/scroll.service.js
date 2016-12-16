(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatScrollService', chatScrollService);

    function chatScrollService(elementScrollService, chatLocalStateService) {

      return {
        scrollDown: scrollDown,
        setCanScrollDown: setCanScrollDown,
        canScrollDown: canScrollDown
      };

      function scrollDown() {
        elementScrollService.autoScrollDown(angular.element('.ms-body .lv-body'));
      }

      function setCanScrollDown(conversationId, value) {
        var conversation = chatLocalStateService.findConversation(conversationId);

        if (conversation) {
          conversation.canScrollDown = value;
        }
      }

      function canScrollDown(conversationId) {
        var conversation = chatLocalStateService.findConversation(conversationId);

        if (conversation) {
          return (conversation.canScrollDown && chatLocalStateService.isActiveRoom(conversation._id));
        }
      }
    }
})();
