'use strict';

module.exports = {
  WEBSOCKET: {
    NAMESPACE: '/chat'
  },
  STATUS: {
    DISCONNECTION_DELAY: 10000, //in millisecond
    DISCONNECTED: 'disconnected',
    DEFAULT_CONNECTED_STATE: 'connected'
  },
  DEFAULT_LIMIT: 10,
  DEFAULT_OFFSET: 0,
  NOTIFICATIONS: {
    MESSAGE_RECEIVED: 'chat:message:received',
    USER_STATE: 'user:state',
    USER_CONNECTION: 'user:connection',
    USER_DISCONNECTION: 'user:disconnection',
    CHANNEL_CREATION: 'chat:channel:creation',
    CHANNEL_DELETION: 'chat:channel:deletion',
    TOPIC_UPDATED: 'chat:message:text:channel:topic',
    COMMUNITY_CREATED: 'communities:community:add',
    MEMBER_ADDED_IN_COMMUNITY: 'community:member:add',
    COMMUNITY_UPDATE: 'communities:community:update',
    CONVERSATION_UPDATE: 'chat:conversation:update',
    USERS_MENTION: 'chat:users_mention',
    CONVERSATION_INITIALIZED: 'chat:conversation:initialized',
    MEMBER_ADDED_IN_CONVERSATION: 'chat:conversation:members:add'
  },
  DEFAULT_CHANNEL: {
    name: 'general',
    type: 'channel',
    topic: 'default',
    purpose: 'default',
    isNotRead: false
  },
  CONVERSATION_TYPE: {
    PRIVATE: 'private',
    CHANNEL: 'channel',
    COMMUNITY: 'community'
  },
  MESSAGE_TYPE: {
    USER_TYPING: 'user_typing'
  },
  SKIP_FIELDS: {
    USER: '-password -accounts'
  }
};
