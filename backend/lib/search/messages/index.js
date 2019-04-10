'use strict';

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const listener = require('./listener')(dependencies);
  const search = require('./search')(dependencies);
  const reindex = require('./reindex')(dependencies);
  let searchHandler;

  return {
    indexMessage,
    registerListener,
    registerReindexTask,
    removeMessageFromIndex,
    search
  };

  function indexMessage(message, callback) {
    if (!searchHandler) {
      return callback(new Error('chat.messages search is not initialized'));
    }

    if (!message) {
      return callback(new Error('message is required'));
    }
    searchHandler.indexData(message, callback);
  }

  function registerListener() {
    logger.info('Subscribing to chat.messages updates for indexing');
    searchHandler = listener.register();
  }

  function registerReindexTask() {
    logger.info('Register reindex mechanism for chat.messages');
    reindex.register();
  }

  function removeMessageFromIndex(message, callback) {
    if (!searchHandler) {
      return callback(new Error('chat.messages search is not initialized'));
    }

    if (!message) {
      return callback(new Error('message is required'));
    }
    searchHandler.removeFromIndex(message, callback);
  }
};
