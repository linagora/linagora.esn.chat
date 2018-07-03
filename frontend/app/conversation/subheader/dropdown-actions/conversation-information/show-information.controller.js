(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatShowInformationDropdownActionController', ChatShowInformationDropdownActionController);

  function ChatShowInformationDropdownActionController(
    $scope,
    $state,
    chatConversationsStoreService
  ) {
    var self = this;
    var CONVERSATION_VIEW_STATE = 'chat.channels-views',
        CONVERSATION_VIEW_AND_SUMMARY_STATE = 'chat.channels-views.summary';

    self.toggleDisplay = toggleDisplay;
    self.informationShown = $state.includes(CONVERSATION_VIEW_AND_SUMMARY_STATE);

    function toggleDisplay() {
      if ($state.includes(CONVERSATION_VIEW_AND_SUMMARY_STATE)) {
        $state.go(CONVERSATION_VIEW_STATE);
      } else {
        $state.go(CONVERSATION_VIEW_AND_SUMMARY_STATE, {id: chatConversationsStoreService.activeRoom._id});
      }
    }

    $scope.$on('$stateChangeSuccess', function(event, toState) {
      self.informationShown = (toState.name === CONVERSATION_VIEW_AND_SUMMARY_STATE);
    });
  }
})();
