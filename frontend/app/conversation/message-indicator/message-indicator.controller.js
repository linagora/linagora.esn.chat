(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatMessageIndicatorController', ChatMessageIndicatorController);

  function ChatMessageIndicatorController($scope, session, chatConversationsStoreService, chatScrollService, CHAT_EVENTS) {
    var self = this;

    self.chatConversationsStoreService = chatConversationsStoreService;
    self.manualScrollDown = manualScrollDown;
    self.show = false;
    self.unreads = 0;
    self.$onChanges = $onChanges;

    function manualScrollDown() {
      chatScrollService.scrollDown();
      self.show = false;
      self.unreads = 0;
    }

    function $onChanges(changesObj) {
      if (changesObj.inview && changesObj.inview.currentValue) {
        self.show = false;
        self.unreads = 0;
      } else {
        self.show = true;
      }
    }

    [CHAT_EVENTS.TEXT_MESSAGE, CHAT_EVENTS.FILE_MESSAGE].forEach(function(eventReceived) {
      $scope.$on(eventReceived, function(event, message) {
        if (message.channel && message.channel === self.chatConversationsStoreService.activeRoom._id) {
          if (message.creator._id !== session.user._id && !self.inview) {
            self.show = true;
            self.unreads++;
          }
        }
      });
    });
  }
})();
