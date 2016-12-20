'use strict';

module.exports = function(dependencies, lib) {

  const message = require('./message')(dependencies, lib);
  const system = require('./system')(dependencies, lib);

  return {
    listeners: {
      message,
      system
    },
    start
  };

  function start() {
    message.start();
    system.start();
  }
};
