(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatConversationList', chatConversationList);

    function chatConversationList() {
      var directive = {
        restrict: 'E',
        templateUrl: '/chat/app/conversation/list/conversation-list.html',
        scope: {
          channelState: '@',
          types: '='
        },
        controller: chatConversationListController,
        controllerAs: 'vm',
        bindToController: true
      };

      return directive;
    }

    function chatConversationListController(chatLocalStateService) {
      var self = this;

      self.wanted = wanted;
      self.groups = chatLocalStateService.conversations;
      self.hasWantedConversation = hasWantedConversation;

      function hasWantedConversation() {
        return self.groups.some(function(group) {
          return wanted(group);
        });
      }

      function wanted(conversation) {
        return self.types.indexOf(conversation.type) > -1;
      }
    }
})();
