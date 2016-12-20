'use strict';

module.exports = function(dependencies, lib) {

  const joinConversationListener = require('./join-conversation')(dependencies, lib);

  return {
    joinConversationListener,
    start
  };

  function start() {
    joinConversationListener.start();
  }
};
