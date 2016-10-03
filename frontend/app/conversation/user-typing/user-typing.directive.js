(function() {
  /*eslint strict: [2, "function"]*/
  /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatUserTyping', chatUserTyping);

    chatUserTyping.$inject = ['_', 'session', 'userUtils', 'chatLocalStateService'];

    function chatUserTyping(_, session, userUtils, chatLocalStateService) {
      var directive = {
        restrict: 'E',
        scope: true,
        templateUrl: '/chat/app/conversation/user-typing/user-typing.html',
        link: link
      };

      return directive;

      function link(scope) {
        session.ready.then(function(session) {
          scope.typing = {};
          scope.$on('chat:message:user_typing', function(evt, message) {
            scope.typing[message.creator._id] = message;

            scope.usersTyping = _.chain(scope.typing)
              .filter(function(message) {
                return message.state && chatLocalStateService.activeRoom._id === message.channel && message.creator._id !== session.user._id;
              })
              .map('creator')
              .map(userUtils.displayNameOf)
              .value();
          });
        });
      }
    }
})();
