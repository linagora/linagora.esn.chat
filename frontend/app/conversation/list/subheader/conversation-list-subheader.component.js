(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationListSubheader', chatConversationListSubheader());

  function chatConversationListSubheader() {
    var component = {
      templateUrl: '/chat/app/conversation/list/subheader/conversation-list-subheader.html'
    };

    return component;
  }

})();
