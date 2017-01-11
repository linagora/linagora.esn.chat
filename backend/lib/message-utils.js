'use strict';

const CONSTANTS = require('./constants');

module.exports = {
  getSystemMessageSubtypes,
  isSystemMessage
};

function getSystemMessageSubtypes() {
  return [CONSTANTS.MESSAGE_SUBTYPE.CONVERSATION_JOIN, CONSTANTS.MESSAGE_SUBTYPE.TOPIC_UPDATE];
}

function isSystemMessage(message) {
  return !!(message && message.subtype && getSystemMessageSubtypes().includes(message.subtype));
}
