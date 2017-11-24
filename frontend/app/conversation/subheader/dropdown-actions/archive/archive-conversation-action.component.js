(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatArchiveConversationDropdownAction', chatArchiveConversationDropdownAction());

  function chatArchiveConversationDropdownAction() {
    var component = {
      templateUrl: 'chat/app/conversation/subheader/dropdown-actions/archive/archive-conversation-action.html'
    };

    return component;
  }

})();
