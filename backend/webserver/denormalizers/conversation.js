'use strict';

const Q = require('q');

module.exports = function(dependencies, lib) {

  return denormalize;

  function denormalize(conversation) {
    if (!conversation) {
      return Q();
    }

    if (typeof conversation.toObject === 'function') {
      conversation = conversation.toObject();
    }

    return Q(conversation);
  }
};
