'use strict';

module.exports = function(dependencies) {

  const messages = require('./messages')(dependencies);

  return {
    init
  };

  function init() {
    messages.registerListener();
  }

};
