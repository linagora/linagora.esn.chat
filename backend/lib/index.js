'use strict';

module.exports = function(dependencies) {

  var models = {
    channel: require('./db/channel')(dependencies),
    message: require('./db/message')(dependencies)
  };
  var listener = require('./listener')(dependencies);
  var channel = require('./channel')(dependencies);
  var userState = require('./userState')(dependencies);

  function start(callback) {
    listener.start(channel);
    userState.init();
    callback();
  }

  return {
    start: start,
    constants: require('./constants'),
    channel: channel,
    userState: userState,
    models: models
  };
};
