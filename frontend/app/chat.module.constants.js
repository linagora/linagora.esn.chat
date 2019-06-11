(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .constant('CHAT', {
      DEFAULT_FETCH_SIZE: 20,
      DEFAULT_FETCH_OFFSET: 0
    })
    .constant('CHAT_ATTACHMENT_PROVIDER', {
      conversation: 'chat.conversation'
    })
    .constant('CHAT_MEMBER_STATUS', {
      MEMBER: 'member',
      NONE: 'none'
    })
    .constant('CHAT_LOCAL_STORAGE', {
      LAST_CONVERSATION: 'chat.last-conversation',
      DESKTOP_NOTIFICATION: 'chat.desktop-notification'
    })
    .constant('CHAT_DRAG_FILE_CLASS', {
      IS_MEMBER: 'show-overlay',
      IS_NOT_MEMBER: 'show-overlay-not-member'
    })
    .constant('CHAT_EVENTS', {
      CONVERSATION_TOPIC_UPDATED: 'chat:conversation:topic:updated',
      MEMBER_ADDED_TO_CONVERSATION: 'chat:conversation:members:added',
      MEMBER_JOINED_CONVERSATION: 'chat:conversation:members:joined',
      MEMBER_LEFT_CONVERSATION: 'chat:conversation:members:left',
      MEMBER_READ_CONVERSATION: 'chat:conversation:member:read',
      MESSAGE_RECEIVED: 'chat:message:received',
      USER_CHANGE_STATE: 'user:state',
      NEW_CONVERSATION: 'chat:conversation:created',
      CONVERSATION_DELETION: 'chat:conversation:deleted',
      TEXT_MESSAGE: 'chat:message:text',
      BOT_MESSAGE: 'chat:message:bot',
      FILE_MESSAGE: 'chat:message:file',
      SET_ACTIVE_ROOM: 'chat:message:set_active_room',
      UNSET_ACTIVE_ROOM: 'chat:message:unset_active_room',
      CONVERSATIONS: {
        UPDATE: 'chat:conversation:update'
      }
    })
    .constant('CHAT_WEBSOCKET_EVENTS', {
      MESSAGE: 'message',
      CONVERSATION: {
        MEMBER_READ: 'chat:conversation:member:read',
        MEMBER_UNSUBSCRIBED: 'chat:conversation:member:unsubscribed'
      }
    })
    .constant('CHAT_WEBSOCKET_ROOM', {
      DEFAULT: 'default'
    })
    .constant('CHAT_MESSAGE_DISPLAYABLE_TYPES', {
      USER: 'user',
      SYSTEM: 'system',
      BOT: 'bot'
    })
    .constant('CHAT_MESSAGE_PREFIX', 'chat:message:')
    .constant('CHAT_SYSTEM_MESSAGE_SUBTYPES', ['conversation_join', 'conversation_leave', 'topic_update'])
    .constant('CHAT_STATUS_ICON', {
      CONFIDENTIAL: 'confidential',
      DM: 'dm',
      OPEN: 'open'
    })
    .constant('CHAT_MENTION_CHAR', '@')
    .constant('CHAT_NAMESPACE', '/chat')
    .constant('CHAT_NOTIFICATION', {
      AUTO_CLOSE: 4000,
      DEFAULT_ICON: '/images/default_avatar.png',
      DEFAULT_TITLE: 'OpenPaas Chat',
      LOCAL_STORAGE_ENABLED: 'isNotificationEnabled'
    })
    .constant('CHAT_CONVERSATION_TYPE', {
      OPEN: 'open',
      CONFIDENTIAL: 'confidential',
      DIRECT_MESSAGE: 'directmessage'
    })
    .constant('CHAT_CONVERSATION_MODE', {
      CHANNEL: 'channel'
    })
    .constant('CHAT_DEFAULT_CHANNEL', {
      CHANNEL: {
        name: 'general',
        type: 'restricted',
        mode: 'channel',
        topic: 'default',
        purpose: 'default',
        isNotRead: false
      }
    })
    .constant('CHAT_OBJECT_TYPES', {
      CONVERSATION: 'chat.conversation',
      MESSAGE: 'chat.message'
    })
    .constant('MENTION_CHOOSER_MAX_RESULT', 15)
    .constant('CHAT_MESSAGE_TYPE', {
      USER_TYPING: 'user_typing',
      TEXT: 'text',
      FILE: 'file'
    })
    .constant('CHAT_MESSAGE_GROUP', {
      SAME_USER_LENGTH: 10,
      TIMESPAN: 60000
    })
    .constant('KEY_CODE', {
      ENTER: 13,
      TAB: 9,
      ARROW_LEFT: 37,
      ARROW_UP: 38,
      ARROW_RIGHT: 39,
      ARROW_DOWN: 40
    })
    .constant('CHAT_BOT', {
      MESSAGE_DEFAULT_SUBTYPES: 'text',
      MESSAGE_SUBTYPES: {
        TEXT: 'text',
        NOT_MEMBER_MENTION: 'notmember-mention'
      }
    })
    .constant('CHAT_MODULE_METADATA', {
      id: 'linagora.esn.chat',
      title: 'Chat',
      icon: '/chat/images/chat-icon.svg',
      homePage: 'chat',
      disableable: true,
      isDisplayedByDefault: false
    })
    .constant('STAR_LINK_TYPE', 'star')
    .constant('CHAT_MARK_AS_READ_THROTTLE_TIMER', 1000);
})();
