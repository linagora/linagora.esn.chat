'use strict';

module.exports = function(dependencies) {

  const messages = require('./messages')(dependencies);

  return {
    init,
    messages
  };

  function init() {
    messages.registerListener();
  }

};
