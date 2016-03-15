'use strict';

module.exports = function(dependencies) {

  function start(callback) {
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
