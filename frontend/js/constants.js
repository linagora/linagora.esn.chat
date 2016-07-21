'use strict';

angular.module('linagora.esn.chat')
  .constant('CHAT', {
    DEFAULT_FETCH_SIZE: 20
  })
  .constant('CHAT_EVENTS', {
    MESSAGE_RECEIVED: 'chat:message:received',
    USER_CHANGE_STATE: 'user:state',
    NEW_CHANNEL: 'chat:channel:creation',
    SWITCH_CURRENT_CHANNEL: 'chat:channel:switch_current_channel',
    TEXT_MESSAGE: 'chat:message:text',
    TOPIC_UPDATED: 'chat:message:text:channel:topic'
  })
  .constant('CHAT_NAMESPACE', '/chat')
  .constant('CHAT_NOTIF', {
    CHAT_AUTO_CLOSE: 4000,
    CHAT_DEFAULT_ICON: '/images/default_avatar.png'
  })
  .constant('CHAT_CONVERSATION_TYPE', {
    CHANNEL: 'channel',
    PRIVATE: 'private'
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
  .constant('KEY_CODE', {
    ENTER: 13,
    TAB: 9,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40
  });
