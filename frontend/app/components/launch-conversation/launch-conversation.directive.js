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
        isCurrentUser: '@',
        onSuccess: '&?'
      },
      restrict: 'A'
    };

    function link(scope, element, attributes, controller) {
      element.bind('click', function(evt) {
        var isCurrentUser = scope.isCurrentUser === 'true';
        evt.stopPropagation();
        if (isCurrentUser) return;
        controller.launch(scope.onSuccess);
      });
    }
  }
})();
