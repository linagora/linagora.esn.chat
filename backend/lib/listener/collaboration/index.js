'use strict';

module.exports = (dependencies, lib) => {

  const join = require('./join')(dependencies, lib);
  const leave = require('./leave')(dependencies, lib);
  const memberAdded = require('./member-added')(dependencies, lib);

  return {
    listeners: {
      join,
      leave,
      memberAdded
    },
    start
  };

  function start() {
    join.start();
    leave.start();
    memberAdded.start();
  }
};
