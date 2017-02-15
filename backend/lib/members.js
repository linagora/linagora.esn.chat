'use strict';

const Q = require('q');
const CONSTANTS = require('./constants');
const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;

module.exports = function(dependencies) {

  const collaborationModule = dependencies('collaboration');

  return {
    countMembers,
    getMembers,
    isMember,
    join
  };

  function countMembers(conversation) {
    return Q.denodeify(collaborationModule.member.countMembers)(CONSTANTS.OBJECT_TYPES.CONVERSATION, conversation._id);
  }

  function getMembers() {
    return Q([]);
  }

  function isMember(conversation, user) {
    return Q.denodeify(collaborationModule.member.isMember)(conversation, {objectType: OBJECT_TYPES.USER, id: String(user._id)});
  }

  function join(conversation, user) {
    return Q.denodeify(collaborationModule.member.join)(OBJECT_TYPES.CONVERSATION, conversation, user, user, user);
  }
};
