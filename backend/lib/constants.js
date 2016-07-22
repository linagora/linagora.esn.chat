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
  NOTIFICATIONS: {
    MESSAGE_RECEIVED: 'chat:message:received',
    USER_STATE: 'user:state',
    USER_CONNECTION: 'user:connection',
    USER_DISCONNECTION: 'user:disconnection',
    CHANNEL_CREATION: 'chat:channel:creation',
    TOPIC_UPDATED: 'chat:message:text:channel:topic',
    COMMUNITY_CREATED: 'communities:community:add',
    MEMBER_ADDED_IN_COMMUNITY: 'community:member:add',
    USERS_MENTION: 'chat:users_mention',
    CONVERSATION_INITIALIZED: 'chat:conversation:initialized'
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
  }
};
