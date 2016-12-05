(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .constant('CHAT', {
      DEFAULT_FETCH_SIZE: 20
    })
    .constant('CHAT_EVENTS', {
      MESSAGE_RECEIVED: 'chat:message:received',
      USER_CHANGE_STATE: 'user:state',
      NEW_CONVERSATION: 'chat:channel:creation',
      CONVERSATION_DELETION: 'chat:channel:deletion',
      TEXT_MESSAGE: 'chat:message:text',
      FILE_MESSAGE: 'chat:message:file',
      TOPIC_UPDATED: 'chat:message:text:channel:topic',
      SET_ACTIVE_ROOM: 'chat:message:set_active_room',
      UNSET_ACTIVE_ROOM: 'chat:message:unset_active_room',
      CONVERSATIONS: {
        NEW: 'chat:conversations:new',
        ADD_NEW_MEMBERS: 'chat:conversation:members:add',
        UPDATE: 'chat:conversation:update'
      }
    })
    .constant('CHAT_NAMESPACE', '/chat')
    .constant('CHAT_NOTIF', {
      CHAT_AUTO_CLOSE: 4000,
      CHAT_DEFAULT_ICON: '/images/default_avatar.png'
    })
    .constant('CHAT_CONVERSATION_TYPE', {
      CHANNEL: 'channel',
      PRIVATE: 'private',
      COMMUNITY: 'community'
    })
    .constant('CHAT_DEFAULT_CHANNEL', {
      CHANNEL: {
        name: 'general',
        type: 'channel',
        topic: 'default',
        purpose: 'default',
        isNotRead: false
      }
    })
    .constant('MENTION_CHOOSER_MAX_RESULT', 15)
    .constant('MESSAGE_TYPE', {
      TYPING: 'user_typing',
      TEXT: 'text'
    })
    .constant('MESSAGE_GROUP_TIMESPAN', 60000)
    .constant('KEY_CODE', {
      ENTER: 13,
      TAB: 9,
      ARROW_LEFT: 37,
      ARROW_UP: 38,
      ARROW_RIGHT: 39,
      ARROW_DOWN: 40
    });
})();
