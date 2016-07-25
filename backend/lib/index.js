'use strict';

module.exports = function(dependencies) {

  var models = {
    conversation: require('./db/conversation')(dependencies),
    message: require('./db/message')(dependencies)
  };
  var message = require('./message')(dependencies);
  var conversation = require('./conversation')(dependencies);
  var userState = require('./userState')(dependencies);

  function start(callback) {
    message.listener.start(conversation);
    userState.init();
    callback();
  }

  return {
    start: start,
    constants: require('./constants'),
    conversation: conversation,
    message: message,
    userState: userState,
    models: models
  };
};
