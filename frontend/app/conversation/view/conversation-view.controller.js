(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatConversationViewController', ChatConversationViewController);

  function ChatConversationViewController(
    _,
    $log,
    $scope,
    $q,
    $timeout,
    session,
    usSpinnerService,
    chatConversationService,
    chatConversationActionsService,
    chatConversationMemberService,
    chatScrollService,
    chatConversationsStoreService,
    chatMessageService,
    CHAT_MESSAGE_GROUP,
    CHAT_EVENTS,
    CHAT,
    CHAT_DRAG_FILE_CLASS,
    ESN_APP_STATE_CHANGE_EVENT
  ) {
    var self = this,
      messageCounterFromTheSameUser = 0;

    self.spinnerKey = 'ChatConversationSpinner';
    self.chatConversationsStoreService = chatConversationsStoreService;
    self.chatConversationActionsService = chatConversationActionsService;
    self.user = session.user;
    self.messages = [];
    self.glued = true;
    self.loadPreviousMessages = loadPreviousMessages;
    self.newMessage = newMessage;
    self.topOfConversation = false;
    self.setLastLineInView = setLastLineInView;
    self.inview = false;
    self.onDragOver = onDragOver;
    self.$onInit = $onInit;

    function addUniqId(message) {
      message._uniqId = message.creator._id + ':' + message.timestamps.creation + '' + message.text;
    }

    function getConversationId() {
      return chatConversationsStoreService.activeRoom._id;
    }

    function getOlderMessageId() {
      return self.messages && self.messages[0] && self.messages[0]._id;
    }

    function updateMessageSameUser(message, isTheSameUser) {
      message.sameUser = isTheSameUser;
      messageCounterFromTheSameUser = isTheSameUser ? messageCounterFromTheSameUser + 1 : 1;
    }

    function newMessage(message) {
      addUniqId(message);
      // chances are, the new message is the most recent
      // So we traverse the array starting by the end
      for (var i = self.messages.length - 1; i > -1; i--) {
        if (self.messages[i].timestamps.creation < message.timestamps.creation) {
          updateMessageSameUser(message, isSameUser(message, self.messages[i]) && !chatMessageService.isSystemMessage(self.messages[i]));
          self.messages.splice(i + 1, 0, message);

          return;
        }
      }
      updateMessageSameUser(message, false);
      self.messages.unshift(message);
    }

    function queueOlderMessages(messages, isFirstLoad) {
      if (isFirstLoad) {
        return messages.forEach(function(message) {
          addUniqId(message);
          self.messages.push(message);
        });
      }

      messages.reverse().forEach(function(message) {
        addUniqId(message);
        self.messages.unshift(message);
      });
    }

    function loadPreviousMessages(isFirstLoad) {
      if (self.topOfConversation) {
        return $q.when([]);
      }

      isFirstLoad = isFirstLoad || false;
      var options = {limit: CHAT.DEFAULT_FETCH_SIZE};
      var older = getOlderMessageId();

      if (older) {
        options.before = older;
      }

      usSpinnerService.spin(self.spinnerKey);

      return chatConversationService.fetchMessages(getConversationId(), options)
        .then(checkMessagesOfSameUser)
        .then(function(result) {
          self.topOfConversation = result.length < CHAT.DEFAULT_FETCH_SIZE;
          var lastLoaded = result.length - 1;

          queueOlderMessages(result, isFirstLoad);

          if (!isFirstLoad && lastLoaded > 0) {
            for (var i = lastLoaded; i < self.messages.length - lastLoaded && i < lastLoaded + CHAT_MESSAGE_GROUP.SAME_USER_LENGTH; i++) {
              updateMessageSameUser(self.messages[i + 1], isSameUser(self.messages[i], self.messages[i + 1]));
            }
          }

          return self.messages;
        })
        .catch(function(err) {
          $log.error('Error while fetching messages', err);

          return $q.reject(new Error('Error while fetching messages'));
        })
        .finally(function() {
          usSpinnerService.stop(self.spinnerKey);
        });
    }

    function checkMessagesOfSameUser(messages) {
      var previousMessage;

      messages.forEach(function(message) {
        if (!previousMessage) {
          previousMessage = message;
          updateMessageSameUser(message, false);
        } else {
          updateMessageSameUser(message, isSameUser(previousMessage, message) && !chatMessageService.isSystemMessage(previousMessage));
          previousMessage = message;
        }
      });

      return messages;
    }

    function scrollDown(isOwnerOfmessage, messageChannel) {
      if (isOwnerOfmessage || self.inview) {
        chatScrollService.setCanScrollDown(messageChannel, true);
        chatScrollService.scrollDown();
      } else {
        chatScrollService.setCanScrollDown(messageChannel, false);
      }
    }

    function setLastLineInView(inview) {
      self.inview = inview;
    }

    function isSameUser(previousMessage, nextMessage) {
      return previousMessage && nextMessage && previousMessage.creator._id === nextMessage.creator._id &&
      Math.abs(nextMessage.timestamps.creation - previousMessage.timestamps.creation) < CHAT_MESSAGE_GROUP.TIMESPAN &&
      messageCounterFromTheSameUser < CHAT_MESSAGE_GROUP.SAME_USER_LENGTH;
    }

    function $onInit() {
      chatConversationActionsService.markAllMessagesAsRead(chatConversationsStoreService.activeRoom);
      loadPreviousMessages(true).then(function(isOwnerOfmessage, messageChannel) {
        $timeout(function() {
          scrollDown(isOwnerOfmessage, messageChannel);
        }, 0);
      });
      $scope.$on(ESN_APP_STATE_CHANGE_EVENT, function(event, foreground) {
        if (foreground) {
          chatConversationActionsService.markAllMessagesAsRead(chatConversationsStoreService.activeRoom);
        }
      });
    }

    function isDuplicate(message) {
      return _.find(self.messages, {_uniqId: message._uniqId});
    }

    function onDragOver() {
      return chatConversationMemberService.currentUserIsMemberOf(chatConversationsStoreService.activeRoom) ? CHAT_DRAG_FILE_CLASS.IS_MEMBER : CHAT_DRAG_FILE_CLASS.IS_NOT_MEMBER;
    }

    [CHAT_EVENTS.BOT_MESSAGE, CHAT_EVENTS.TEXT_MESSAGE, CHAT_EVENTS.FILE_MESSAGE].forEach(function(eventReceived) {
      $scope.$on(eventReceived, function(event, message) {
        if (message.channel && message.channel === self.chatConversationsStoreService.activeRoom._id) {
          addUniqId(message);

          if (!isDuplicate(message)) {
            self.newMessage(message);
            scrollDown(message.creator._id === session.user._id, message.channel);
          }
        }
      });
    });
  }
})();
