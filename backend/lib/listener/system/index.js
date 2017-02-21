'use strict';

module.exports = function(dependencies, lib) {

  const joinConversationListener = require('./join-conversation')(dependencies, lib);
  const leaveConversationListener = require('./leave-conversation')(dependencies, lib);
  const updateTopicListener = require('./update-topic')(dependencies, lib);

  return {
    joinConversationListener,
    leaveConversationListener,
    start,
    updateTopicListener
  };

  function start() {
    joinConversationListener.start();
    leaveConversationListener.start();
    updateTopicListener.start();
  }
};
