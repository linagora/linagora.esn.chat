'use strict';

angular.module('linagora.esn.chat')
  .constant('CHAT', {
    DEFAULT_FETCH_SIZE: 20
  })
  .constant('CHAT_EVENTS', {
    MESSAGE_RECEIVED: 'message:received'
  });
