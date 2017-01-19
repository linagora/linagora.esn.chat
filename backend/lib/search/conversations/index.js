'use strict';

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const listener = require('./listener')(dependencies);
  const search = require('./search')(dependencies);
  let searchHandler;

  return {
    indexConversation,
    registerListener,
    removeConversationFromIndex,
    search
  };

  function indexConversation(conversation, callback) {
    if (!searchHandler) {
      return callback(new Error('chat.conversations search is not initialized'));
    }

    if (!conversation) {
      return callback(new Error('conversation is required'));
    }
    searchHandler.indexData(conversation, callback);
  }

  function registerListener() {
    logger.info('Subscribing to chat.conversations updates for indexing');
    searchHandler = listener.register();
  }

  function removeConversationFromIndex(conversation, callback) {
    if (!searchHandler) {
      return callback(new Error('chat.conversations search is not initialized'));
    }

    if (!conversation) {
      return callback(new Error('conversation is required'));
    }
    searchHandler.removeFromIndex(conversation, callback);
  }
};
