(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatAddGroupController', ChatAddGroupController);

  ChatAddGroupController.$inject = ['$state', 'chatConversationsService', 'chatLocalStateService'];

  function ChatAddGroupController($state, chatConversationsService, chatLocalStateService) {
    var self = this;

    self.members = [];
    self.addGroup = addGroup;

    function addGroup() {
      var group = {
        members: self.members
      };

      chatConversationsService.addPrivateConversation(group).then(function(response) {
        chatLocalStateService.addConversation(response.data);
        $state.go('chat.channels-views', { id: response.data._id});
      });
    }
  }
})();
