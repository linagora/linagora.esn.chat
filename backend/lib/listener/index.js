'use strict';

module.exports = function(dependencies) {

  const message = require('./message')(dependencies);

  return {
    listeners: {
      message
    },
    start
  };

  function start(lib) {
    message.start(lib);
  }
};
