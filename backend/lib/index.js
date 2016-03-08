'use strict';

module.exports = function(dependencies) {

  function start(callback) {
    callback();
  }

  return {
    start: start,
    constants: require('./constants')
  };
};
