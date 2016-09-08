'use strict';

module.exports = function(dependencies) {

  var models = {
    conversation: require('./db/conversation')(dependencies),
    message: require('./db/message')(dependencies)
  };

  var message = require('./message')(dependencies);
  var conversation = require('./conversation')(dependencies);
  var userState = require('./userState')(dependencies);
  var moderate = require('./moderate')(dependencies);

  function start(callback) {
    message.listener.start(conversation);
    userState.init();
    moderate.start();
    callback();
  }

  return {
    start: start,
    constants: require('./constants'),
    conversation: conversation,
    moderate: moderate,
    message: message,
    userState: userState,
    models: models
  };
};
