(function() {
  /*eslint strict: [2, "function"]*/
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatConversationImage', chatConversationImage);

  function chatConversationImage() {
    var directive = {
      restrict: 'E',
      scope: {
        conversation: '='
      },
      controller: chatConversationImageController,
      templateUrl: '/chat/views/conversation-image.html',
      bindToController: true
    };

    return directive;
  }

  chatConversationImageController.$inject = ['session', '_'];

  function chatConversationImageController(session, _) {
    var self = this;

    session.ready.then(sessionReady);

    function sessionReady(session) {
      self.getMembers = function() {
        var members = self.conversation && self.conversation.members ? self.conversation.members : [];

        members = members.length === 1 ? members : _.reject(members, {_id: session.user._id});

        return members.slice(0, 4);
      };
    }
  }
})();
