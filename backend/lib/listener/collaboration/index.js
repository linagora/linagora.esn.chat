'use strict';

module.exports = (dependencies, lib) => {

  const join = require('./join')(dependencies, lib);
  const leave = require('./leave')(dependencies, lib);

  return {
    listeners: {
      join,
      leave
    },
    start
  };

  function start() {
    join.start();
    leave.start();
  }
};
