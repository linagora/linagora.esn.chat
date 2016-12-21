(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatConversationBeginning', chatConversationBeginning());

    function chatConversationBeginning() {
      var component = {
        templateUrl: '/chat/app/conversation/beginning/beginning.html',
        controller: 'ChatConversationBeginningController',
        controllerAs: 'ctrl',
        bindings: {
          conversation: '='
        }
      };

      return component;
    }

})();
