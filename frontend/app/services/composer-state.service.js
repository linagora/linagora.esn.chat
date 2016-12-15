(function() {

  'use strict';

  angular.module('linagora.esn.chat')
  .factory('chatComposerState', chatComposerStateService);

  function chatComposerStateService($log, localStorageService) {
    var storage = localStorageService.getOrCreateInstance('chat-message');
    var service = {
      saveMessage: saveMessage,
      getMessage: getMessage
    };

    return service;

    function saveMessage(channel, message) {
      return storage.setItem(channel, message).catch(function(error) {
        $log.error('Error while saving composing message', error);
      });
    }

    function getMessage(channel) {
      return storage.getItem(channel).catch(function(error) {
        $log.error('Cannot get composing message', error);
      });
    }
  }

})();
