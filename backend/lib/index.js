'use strict';

module.exports = function(dependencies) {

  var models = {
    channel: require('./db/channel'),
    message: require('./db/message')
  };
  var listener = require('./listener')(dependencies);

  function start(callback) {
    listener.start();
    callback();
  }

  return {
    start: start,
    constants: require('./constants'),
    channel: require('./channel'),
    models: models
  };
};
