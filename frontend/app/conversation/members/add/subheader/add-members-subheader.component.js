(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatMembersAddSubheader', chatMembersAddSubheader());

  function chatMembersAddSubheader() {
    var component = {
      templateUrl: 'chat/app/conversation/members/add/subheader/add-members-subheader.html'
    };

    return component;
  }

})();
