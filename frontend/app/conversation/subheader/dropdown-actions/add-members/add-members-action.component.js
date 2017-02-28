(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatAddMembersDropdownAction', chatAddMembersDropdownAction());

  function chatAddMembersDropdownAction() {
    var component = {
      templateUrl: 'chat/app/conversation/subheader/dropdown-actions/add-members/add-members-action.html',
      controller: 'ChatAddMembersDropdownActionController',
      controllerAs: 'ctrl'
    };

    return component;
  }

})();
