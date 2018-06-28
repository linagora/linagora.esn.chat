(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationSidebarMemberController', ChatConversationSidebarMemberController);

  function ChatConversationSidebarMemberController(
    $state,
    $stateParams,
    $log,
    notificationFactory,
    session,
    userAPI
  ) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
      if ($stateParams.memberId === session.user._id) {
        self.user = session.user;
        self.me = true;

        return;
      }

      userAPI.user($stateParams.memberId)
        .then(function(response) {
          self.user = response.data;
        })
        .catch(function(err) {
          $log.error('Error, user not found', err);
          notificationFactory.weakError('error', 'user not found');
          $state.go('chat.channels-views');
        });
    }
  }
})();
