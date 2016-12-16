(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .component('chatConversationView', chatConversationView());

  function chatConversationView() {
    var component = {
      templateUrl: '/chat/app/conversation/view/conversation-view.html',
      controller: 'ChatConversationViewController',
      controllerAs: 'vm'
    };

    return component;
  }
})();
