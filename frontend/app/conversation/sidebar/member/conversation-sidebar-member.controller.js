(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('ChatConversationSidebarMemberController', ChatConversationSidebarMemberController);

  function ChatConversationSidebarMemberController($stateParams, userAPI, $state, $log, notificationFactory) {
    var self = this;

    self.$onInit = $onInit;

    function $onInit() {
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
