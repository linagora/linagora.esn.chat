'use strict';

angular.module('linagora.esn.chat.core')
  .constant('CHAT', {
    DEFAULT_FETCH_SIZE: 20
  })
  .constant('CHAT_EVENTS', {
    MESSAGE_RECEIVED: 'message:received',
    USER_CHANGE_STATE: 'user:state',
    NEW_CHANNEL: 'channel:creation'
  })
  .constant('CHAT_NAMESPACE', '/chat');
