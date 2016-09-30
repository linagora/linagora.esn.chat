(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatUserTyping', chatUserTyping);

    chatUserTyping.$inject = ['_', 'session', 'userUtils'];

    function chatUserTyping(_, session, userUtils) {
      var directive = {
        restrict: 'E',
        scope: true,
        templateUrl: '/chat/app/conversation/user-typing.html',
        link: link
      };

      return directive;

      function link(scope) {
        session.ready.then(function(session) {
          scope.typing = {};
          /*eslint no-unused-vars: ["error", {"args": "after-used"}]*/
          scope.$on('chat:message:user_typing', function(evt, message) {
            scope.typing[message.creator._id] = message;

            scope.usersTyping = _.chain(scope.typing)
              .filter(function(message) {
                return message.state && scope.chatLocalStateService.activeRoom._id === message.channel && message.creator._id !== session.user._id;
              })
              .map('creator')
              .map(userUtils.displayNameOf)
              .value();
          });
        });
      }
    }
})();
