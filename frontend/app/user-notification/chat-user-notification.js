(function(angular) {
  'use strict';

  angular.module('esn.user-notification')
    .factory('ChatUserNotification', ChatUserNotification);

  function ChatUserNotification(EsnUserNotification) {

    function ChatUserNotification(data) {
      EsnUserNotification.call(this, data);
    }

    return ChatUserNotification;
  }
})(angular);
