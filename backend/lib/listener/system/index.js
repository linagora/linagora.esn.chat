'use strict';

module.exports = function(dependencies, lib) {

  const joinConversationListener = require('./join-conversation')(dependencies, lib);
  const updateTopicListener = require('./update-topic')(dependencies, lib);

  return {
    joinConversationListener,
    start,
    updateTopicListener
  };

  function start() {
    joinConversationListener.start();
    updateTopicListener.start();
  }
};
