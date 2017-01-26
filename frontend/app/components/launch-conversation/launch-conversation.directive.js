(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .directive('chatLaunchConversation', chatLaunchConversation);

  function chatLaunchConversation() {
    return {
      bindToController: true,
      controller: 'ChatLaunchConversationController',
      controllerAs: 'ctrl',
      link: link,
      scope: {
        userId: '@',
        onSuccess: '&?'
      },
      restrict: 'A'
    };

    function link(scope, element, attributes, controller) {
      element.bind('click', function(evt) {
        evt.stopPropagation();
        controller.launch(scope.onSuccess);
      });
    }
  }
})();
