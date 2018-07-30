'use strict';

const Q = require('q');
const CONSTANTS = require('../constants');
const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;

module.exports = function(dependencies) {

  const collaborationModule = dependencies('collaboration');

  return {
    userCanRead,
    userCanRemove,
    userCanUpdate,
    userCanWrite,
    canLeave
  };

  function asTuple(user) {
    return {objectType: OBJECT_TYPES.USER, id: String(user._id)};
  }

  function userCanRead(user, conversation) {
    return Q.denodeify(collaborationModule.permission.canRead)(conversation, asTuple(user));
  }

  function userCanRemove(user, conversation) {
    return Q.denodeify(collaborationModule.permission.canWrite)(conversation, asTuple(user));
  }

  function userCanUpdate(user, conversation) {
    return Q.denodeify(collaborationModule.permission.canWrite)(conversation, asTuple(user));
  }

  function userCanWrite(user, conversation) {
    return Q.denodeify(collaborationModule.permission.canWrite)(conversation, asTuple(user));
  }

  function canLeave(userId, conversation) {
    return Promise.resolve(
      conversation.type !== CONSTANTS.CONVERSATION_TYPE.DIRECT_MESSAGE &&
      String(userId) !== String(conversation.creator)
    );
  }
};
