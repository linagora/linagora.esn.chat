'use strict';

module.exports = {
  WEBSOCKET: {
    NAMESPACE: '/chat'
  },
  STATUS: {
    DISCONNECTION_DELAY: 10000, //in millisecond
    DISCONNECTED: 'disconnected'
  },
  NOTIFICATIONS: {
    MESSAGE_RECEIVED: 'chat:message:received'
  }
};
