(function() {

  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatDropdownMenuActionsService', chatDropdownMenuActionsService);

  function chatDropdownMenuActionsService($q, chatConversationsStoreService, session, chatConversationMemberService, CHAT_CONVERSATION_TYPE) {

    var service = {
      canInjectAddMembersAction: canInjectAddMembersAction,
      canInjectLeaveAction: canInjectLeaveAction,
      canInjectArchiveAction: canInjectArchiveAction
    };

    return service;

    function canInjectLeaveAction() {
      return (chatConversationsStoreService.activeRoom &&
      _activeRoomIsPublicConversation() &&
      !_activeRoomIsTheDefaultConversation() &&
      !_currentUserIsTheCreator() &&
      _currentUserIsMember());
    }

    function _activeRoomIsPublicConversation() {
      return chatConversationsStoreService.activeRoom.type === CHAT_CONVERSATION_TYPE.OPEN;
    }

    function _activeRoomIsTheDefaultConversation() {
      return !chatConversationsStoreService.activeRoom.creator;
    }

    function _currentUserIsTheCreator() {

      if (chatConversationsStoreService.activeRoom.creator && chatConversationsStoreService.activeRoom.creator._id) {
        return session.user._id === chatConversationsStoreService.activeRoom.creator._id;
      }

      return chatConversationsStoreService.activeRoom.creator &&
      session.user._id === chatConversationsStoreService.activeRoom.creator;
    }

    function _currentUserIsMember() {
      return chatConversationsStoreService.activeRoom &&
      chatConversationMemberService.currentUserIsMemberOf(chatConversationsStoreService.activeRoom);
    }

    function canInjectAddMembersAction() {
      return _activeRoomIsPublicConversation() &&
      chatConversationsStoreService.activeRoom &&
      chatConversationMemberService.currentUserIsMemberOf(chatConversationsStoreService.activeRoom);
    }

    function canInjectArchiveAction() {
      return _activeRoomIsPublicConversation() &&
      chatConversationsStoreService.activeRoom &&
      (!_activeRoomIsTheDefaultConversation()) &&
      (session.userIsDomainAdministrator() || _currentUserIsTheCreator());
    }

  }
})();
