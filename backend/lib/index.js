'use strict';

module.exports = function(dependencies) {

  var models = {
    channel: require('./db/channel')(dependencies),
    message: require('./db/message')(dependencies)
  };
  var listener = require('./listener')(dependencies);
  var channel = require('./channel')(dependencies);

  function start(callback) {
    listener.start(channel);
    callback();
  }

  return {
    start: start,
    constants: require('./constants'),
    channel: channel,
    models: models
  };
};
