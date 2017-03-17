(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationItemIconDmController', ChatConversationItemIconDmController);

    function ChatConversationItemIconDmController($scope, session, _) {
      var self = this;

      self.$onInit = $onInit;

      function $onInit() {
        setOtherUserId();
      }

      function setOtherUserId() {
        var others = _.reject(self.conversation.members, function(member) {
          return member.member.id === session.user._id;
        });

        if (others && others.length) {
          self.otherUserId = others[0].member.id;
        }
      }
    }
})();
