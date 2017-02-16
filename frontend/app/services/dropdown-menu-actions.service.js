(function() {

  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatDropdownMenuActionsService', chatDropdownMenuActionsService);

  function chatDropdownMenuActionsService(chatConversationsStoreService, session) {

    var service = {
      canInjectLeaveAction: canInjectLeaveAction
    };

    return service;

    function canInjectLeaveAction() {
      return chatConversationsStoreService.activeRoom && session.user._id !== chatConversationsStoreService.activeRoom.creator;
    }

  }
})();
