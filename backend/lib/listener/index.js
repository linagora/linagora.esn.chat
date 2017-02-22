'use strict';

module.exports = function(dependencies, lib) {

  const collaboration = require('./collaboration')(dependencies, lib);
  const message = require('./message')(dependencies, lib);
  const system = require('./system')(dependencies, lib);

  return {
    listeners: {
      collaboration,
      message,
      system
    },
    start
  };

  function start() {
    collaboration.start();
    message.start();
    system.start();
  }
};
