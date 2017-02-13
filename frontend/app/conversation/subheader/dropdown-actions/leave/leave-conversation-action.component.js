(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatLeaveConversationDropdownAction', chatLeaveConversationDropdownAction());

  function chatLeaveConversationDropdownAction() {
    var component = {
      templateUrl: 'chat/app/conversation/subheader/dropdown-actions/leave/leave-conversation-action.html',
      controller: 'ChatLeaveConversationDropdownActionController',
      controllerAs: 'ctrl'
    };

    return component;
  }

})();
