(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .controller('ChatAddChannelController', ChatAddChannelController);

  ChatAddChannelController.$inject = ['CHAT_CONVERSATION_TYPE', '$state', 'chatConversationsService', 'chatLocalStateService'];

  function ChatAddChannelController(CHAT_CONVERSATION_TYPE, $state, chatConversationsService, chatLocalStateService) {
    var self = this;

    self.addChannel = addChannel;

    function addChannel() {
      var channel = {
        name: self.channel.name,
        type: CHAT_CONVERSATION_TYPE.CHANNEL,
        topic: self.channel.topic || '',
        purpose: self.channel.purpose || ''
      };

      chatConversationsService.addChannels(channel).then(function(response) {
        chatLocalStateService.addConversation(response.data);
        $state.go('chat.channels-views', {id: response.data._id});
      });
    }
  }
})();
