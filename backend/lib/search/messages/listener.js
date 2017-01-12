'use strict';

const Q = require('q');
const messageUtils = require('../../message-utils');
const CONSTANTS = require('../../constants');

module.exports = function(dependencies) {

  const listeners = dependencies('elasticsearch').listeners;
  const denormalize = require('./denormalize')(dependencies);

  return {
    getMessageOptions,
    register
  };

  function getMessageOptions() {
    return {
      events: {
        add: CONSTANTS.NOTIFICATIONS.MESSAGE_SAVED,
        update: CONSTANTS.NOTIFICATIONS.MESSAGE_UPDATED,
        remove: CONSTANTS.NOTIFICATIONS.MESSAGE_REMOVED
      },
      skip: {
        index: skipIndex
      },
      denormalize: denormalize.denormalize,
      getId: denormalize.getId,
      type: CONSTANTS.SEARCH.MESSAGES.TYPE_NAME,
      index: CONSTANTS.SEARCH.MESSAGES.INDEX_NAME
    };
  }

  function register() {
    return listeners.addListener(getMessageOptions());
  }

  function skipIndex(message) {
    return Q(messageUtils.isSystemMessage(message));
  }
};
