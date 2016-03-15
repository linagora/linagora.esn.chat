'use strict';

module.exports = function(dependencies) {

  var listener = require('./listener')(dependencies);

  function start(callback) {
    listener.start();
    callback();
  }

  var model = require('./db/channel');

  return {
    start: start,
    constants: require('./constants'),
    channel: require('./channel'),
    model: model
  };
};
