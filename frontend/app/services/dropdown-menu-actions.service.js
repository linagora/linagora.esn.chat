(function() {

  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatDropdownMenuActionsService', chatDropdownMenuActionsService);

  function chatDropdownMenuActionsService(chatConversationsStoreService, session, chatConversationMemberService) {

    var service = {
      canInjectAddMembersAction: canInjectAddMembersAction,
      canInjectLeaveAction: canInjectLeaveAction,
      canInjectArchiveAction: canInjectArchiveAction
    };

    return service;

    function canInjectLeaveAction() {
      return chatConversationsStoreService.activeRoom && session.user._id !== chatConversationsStoreService.activeRoom.creator && chatConversationMemberService.currentUserIsMemberOf(chatConversationsStoreService.activeRoom);
    }

    function canInjectAddMembersAction() {
      return chatConversationMemberService.currentUserIsMemberOf(chatConversationsStoreService.activeRoom);
    }

    function canInjectArchiveAction() {

      return !!chatConversationsStoreService.activeRoom && !!chatConversationsStoreService.activeRoom.creator && (session.userIsDomainAdministrator() || session.user._id === chatConversationsStoreService.activeRoom.creator);
    }

  }
})();
