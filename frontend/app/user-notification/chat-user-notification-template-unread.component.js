(function(angular) {
  'use strict';

  angular.module('linagora.esn.chat')
    .component('chatUserNotificationTemplateUnread', {
      templateUrl: '/chat/app/user-notification/chat-user-notification-template-unread.html',
      bindings: {
        notification: '<'
      }
    });
})(angular);
