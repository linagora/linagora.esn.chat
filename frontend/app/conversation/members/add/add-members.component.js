(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatMembersAdd', chatMembersAdd());

  function chatMembersAdd() {
    var component = {
      templateUrl: '/chat/app/conversation/members/add/add-members.html',
      controller: 'ChatMemberAddController',
      controllerAs: 'ctrl'
    };

    return component;
  }
})();
