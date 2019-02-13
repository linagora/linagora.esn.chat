'use strict';

module.exports = {
  OBJECT_TYPES: {
    ARCHIVED_CONVERSATION: 'chat.archivedconversation',
    CONVERSATION: 'chat.conversation',
    MESSAGE: 'chat.message',
    USER: 'user'
  },
  WEBSOCKET: {
    NAMESPACE: '/chat',
    DEFAULT_ROOM: 'default'
  },
  DEFAULT_LIMIT: 25,
  DEFAULT_OFFSET: 0,
  NOTIFICATIONS: {
    COLLABORATION_JOIN: 'collaboration:join',
    COLLABORATION_LEAVE: 'collaboration:leave',
    CONVERSATION_ARCHIVED: 'chat:conversation:archived',
    CONVERSATION_CREATED: 'chat:conversation:created',
    CONVERSATION_DELETED: 'chat:conversation:deleted',
    CONVERSATION_INITIALIZED: 'chat:conversation:initialized',
    CONVERSATION_TOPIC_UPDATED: 'chat:conversation:topic:updated',
    CONVERSATION_UPDATED: 'chat:conversation:updated',
    CONVERSATION_SAVED: 'chat:conversation:saved',
    MEMBER_JOINED_CONVERSATION: 'chat:conversation:members:joined',
    MEMBER_LEFT_CONVERSATION: 'chat:conversation:members:left',
    MEMBER_ADDED_TO_CONVERSATION: 'chat:conversation:members:added',
    MEMBER_READ_CONVERSATION: 'chat:conversation:member:read',
    MEMBER_UNSUBSCRIBED_CONVERSATION: 'chat:conversation:member:unsubscribed',
    MEMBERSHIP_EVENTS: 'chat:conversation:membership',
    MESSAGE_RECEIVED: 'chat:message:received',
    MESSAGE_REMOVED: 'chat:message:removed',
    MESSAGE_SAVED: 'chat:message:saved',
    MESSAGE_UPDATED: 'chat:message:updated',
    USER_STATE: 'user:state',
    USER_CONNECTION: 'user:connection',
    USER_DISCONNECTION: 'user:disconnection'
  },
  DEFAULT_CHANNEL: {
    name: 'general',
    type: 'open',
    mode: 'channel',
    topic: 'default',
    purpose: 'default',
    isNotRead: false
  },
  CONVERSATION_MODE: {
    CHANNEL: 'channel'
  },
  CONVERSATION_TYPE: {
    CONFIDENTIAL: 'confidential',
    DIRECT_MESSAGE: 'directmessage',
    OPEN: 'open'
  },
  MEMBERSHIP_ACTION: {
    JOIN: 'join'
  },
  MESSAGE_TYPE: {
    BOT: 'bot',
    TEXT: 'text',
    USER_TYPING: 'user_typing'
  },
  MEMBER_STATUS: {
    MEMBER: 'member',
    NONE: 'none'
  },
  MESSAGE_SUBTYPE: {
    CONVERSATION_JOIN: 'conversation_join',
    CONVERSATION_LEAVE: 'conversation_leave',
    TOPIC_UPDATE: 'topic_update'
  },
  SKIP_FIELDS: {
    USER: '-password'
  },
  SEARCH: {
    MESSAGES: {
      TYPE_NAME: 'chat.messages',
      INDEX_NAME: 'chat.messages.idx'
    },
    CONVERSATIONS: {
      TYPE_NAME: 'chat.conversations',
      INDEX_NAME: 'chat.conversations.idx'
    }
  },
  STAR_LINK_TYPE: 'star',
  SORT_TYPE: {
    ASC: -1,
    DESC: 1
  },
  SORT_FIELDS: {
    CONVERSATION: {
      lastMessageDate: 'last_message.date'
    }
  }
};
