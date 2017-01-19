'use strict';

const CONSTANTS = require('../../constants');

module.exports = function(dependencies) {

  const listeners = dependencies('elasticsearch').listeners;
  const denormalize = require('./denormalize')(dependencies);

  return {
    getConversationOptions,
    register
  };

  function getConversationOptions() {
    return {
      events: {
        add: CONSTANTS.NOTIFICATIONS.CHANNEL_SAVED,
        update: CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATE,
        remove: CONSTANTS.NOTIFICATIONS.CHANNEL_DELETION
      },
      denormalize: denormalize.denormalize,
      getId: denormalize.getId,
      type: CONSTANTS.SEARCH.CONVERSATIONS.TYPE_NAME,
      index: CONSTANTS.SEARCH.CONVERSATIONS.INDEX_NAME
    };
  }

  function register() {
    return listeners.addListener(getConversationOptions());
  }
};
