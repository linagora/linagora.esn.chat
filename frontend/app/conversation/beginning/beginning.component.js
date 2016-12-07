(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationBeginning', chatConversationBeginning());

    function chatConversationBeginning() {
      var component = {
        templateUrl: '/chat/app/conversation/beginning/beginning.html',
        controllerAs: 'ctrl',
        controller: 'ChatConversationBeginningController',
        bindings: {
          conversation: '='
        }
      };

      return component;
    }

})();
