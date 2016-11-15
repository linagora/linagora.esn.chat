'use strict';

module.exports = function(dependencies) {

  const logger = dependencies('logger');
  const listener = require('./listener')(dependencies);
  const search = require('./search')(dependencies);
  let searchHandler;

  return {
    indexMessage,
    registerListener,
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
