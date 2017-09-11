(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatShowInformationDropdownAction', chatShowInformationDropdownAction());

  function chatShowInformationDropdownAction() {
    var component = {
      templateUrl: 'chat/app/conversation/subheader/dropdown-actions/conversation-information/show-information.html',
      controller: 'ChatShowInformationDropdownActionController',
      controllerAs: 'ctrl'
    };

    return component;
  }

})();
