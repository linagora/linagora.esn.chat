'use strict';

module.exports = function(dependencies) {

  const messages = require('./messages')(dependencies);
  const conversations = require('./conversations')(dependencies);

  return {
    conversations,
    init,
    messages
  };

  function init() {
    messages.registerListener();
    messages.registerReindexTask();
    conversations.registerListener();
    conversations.registerReindexTask();
  }
};
