'use strict';

const constants = require('./constants');

module.exports = function(dependencies) {

  let models = {
    conversation: require('./db/conversation')(dependencies),
    message: require('./db/message')(dependencies)
  };

  let message = require('./message')(dependencies);
  let conversation = require('./conversation')(dependencies);
  let userState = require('./userState')(dependencies);
  let moderate = require('./moderate')(dependencies);

  function start(callback) {
    message.listener.start(conversation);
    userState.init();
    moderate.start();
    callback();
  }

  return {
    start,
    constants,
    conversation,
    moderate,
    message,
    userState,
    models
  };
};
