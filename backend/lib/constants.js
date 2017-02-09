'use strict';

module.exports = {
  OBJECT_TYPES: {
    CONVERSATION: 'chat.conversation',
    USER: 'user'
  },
  WEBSOCKET: {
    NAMESPACE: '/chat'
  },
  DEFAULT_LIMIT: 25,
  DEFAULT_OFFSET: 0,
  NOTIFICATIONS: {
    COLLABORATION_JOIN: 'collaboration:join',
    CONVERSATION_CREATED: 'chat:conversation:created',
    CONVERSATION_DELETED: 'chat:conversation:deleted',
    CONVERSATION_INITIALIZED: 'chat:conversation:initialized',
    CONVERSATION_UPDATED: 'chat:conversation:updated',
    CONVERSATION_SAVED: 'chat:conversation:saved',
    MEMBER_ADDED_IN_CONVERSATION: 'chat:conversation:members:add',
    MEMBERSHIP_EVENTS: 'chat:conversation:membership',
    MESSAGE_RECEIVED: 'chat:message:received',
    MESSAGE_REMOVED: 'chat:message:removed',
    MESSAGE_SAVED: 'chat:message:saved',
    MESSAGE_UPDATED: 'chat:message:updated',
    TOPIC_UPDATED: 'chat:message:text:channel:topic',
    USER_STATE: 'user:state',
    USER_CONNECTION: 'user:connection',
    USER_DISCONNECTION: 'user:disconnection',
    USERS_MENTION: 'chat:users_mention'
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
