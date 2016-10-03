'use strict';

const constants = require('./constants');

module.exports = function(dependencies) {

  const models = {
    conversation: require('./db/conversation')(dependencies),
    message: require('./db/message')(dependencies)
  };

  const utils = require('./utils')(dependencies);
  const message = require('./message')(dependencies);
  const conversation = require('./conversation')(dependencies, {utils});
  const community = require('./community')(dependencies, {utils, conversation});
  const userState = require('./userState')(dependencies);
  const moderate = require('./moderate')(dependencies);

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
    community,
    moderate,
    message,
    userState,
    models
  };
};
