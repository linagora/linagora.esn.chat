'use strict';

module.exports = function(dependencies) {

  var models = {
    conversation: require('./db/conversation')(dependencies),
    message: require('./db/message')(dependencies)
  };
  var listener = require('./listener')(dependencies);
  var conversation = require('./conversation')(dependencies);
  var userState = require('./userState')(dependencies);

  function start(callback) {
    listener.start(conversation);
    userState.init();
    callback();
  }

  return {
    start: start,
    constants: require('./constants'),
    conversation: conversation,
    userState: userState,
    models: models
  };
};
