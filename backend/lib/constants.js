'use strict';

module.exports = {
  OBJECT_TYPES: {
    CONVERSATION: 'chat.conversation',
    USER: 'user'
  },
  WEBSOCKET: {
    NAMESPACE: '/chat'
  },
  STATUS: {
    DISCONNECTION_DELAY: 10000, //in millisecond
    DISCONNECTED: 'disconnected',
    DEFAULT_CONNECTED_STATE: 'connected'
  },
  DEFAULT_LIMIT: 25,
  DEFAULT_OFFSET: 0,
  NOTIFICATIONS: {
    MESSAGE_RECEIVED: 'chat:message:received',
    MESSAGE_REMOVED: 'chat:message:removed',
    MESSAGE_SAVED: 'chat:message:saved',
    MESSAGE_UPDATED: 'chat:message:updated',
    USER_STATE: 'user:state',
    USER_CONNECTION: 'user:connection',
    USER_DISCONNECTION: 'user:disconnection',
    CHANNEL_CREATION: 'chat:channel:creation',
    CHANNEL_DELETION: 'chat:channel:deletion',
    CHANNEL_SAVED: 'chat:channel:saved',
    TOPIC_UPDATED: 'chat:message:text:channel:topic',
    CONVERSATION_UPDATE: 'chat:conversation:update',
    USERS_MENTION: 'chat:users_mention',
    CONVERSATION_INITIALIZED: 'chat:conversation:initialized',
    MEMBER_ADDED_IN_CONVERSATION: 'chat:conversation:members:add',
    MEMBERSHIP_EVENTS: 'chat:conversation:membership',
    COLLABORATION_JOIN: 'collaboration:join'
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
    OPEN: 'open'
  },
  MEMBERSHIP_ACTION: {
    JOIN: 'join'
  },
  MESSAGE_TYPE: {
    USER_TYPING: 'user_typing'
  },
  MEMBER_STATUS: {
    MEMBER: 'member',
    NONE: 'none'
  },
  MESSAGE_SUBTYPE: {
    CONVERSATION_JOIN: 'conversation_join',
    TOPIC_UPDATE: 'topic_update'
  },
  SKIP_FIELDS: {
    USER: '-password -accounts'
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
  }
};
