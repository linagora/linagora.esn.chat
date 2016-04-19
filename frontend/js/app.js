'use strict';

angular.module('linagora.esn.chat', ['linagora.esn.chat.core'])
  .run(function(listenChatWebsocket) {
    listenChatWebsocket.initListener();
  });
