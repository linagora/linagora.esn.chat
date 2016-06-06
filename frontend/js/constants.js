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
    TEXT_MESSAGE: 'chat:message:text'
  })
  .constant('CHAT_NAMESPACE', '/chat')
  .constant('CHAT_NOTIF', {
    CHAT_AUTO_CLOSE: 4000,
    CHAT_DEFAULT_ICON: '/images/default_avatar.png'
  });
