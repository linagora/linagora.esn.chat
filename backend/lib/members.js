'use strict';

const Q = require('q');
const CONSTANTS = require('./constants');
const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;

module.exports = function(dependencies) {

  const collaborationModule = dependencies('collaboration');

  return {
    addMember,
    countMembers,
    getNewestMembers,
    getMembers,
    isMember,
    isManager,
    join
  };

  function addMember(conversation, author, memberId, callback) {
    return Q.denodeify(collaborationModule.member.join)(OBJECT_TYPES.CONVERSATION, conversation, author.id, memberId, author, callback);
  }

  function countMembers(conversation) {
    return Q.denodeify(collaborationModule.member.countMembers)(CONSTANTS.OBJECT_TYPES.CONVERSATION, conversation._id);
  }

  function getMembers() {
    return Q([]);
  }

  function getNewestMembers(collaboration, objectType, query) {
    return Q.denodeify(collaborationModule.member.getMembers)(collaboration, objectType, query);
  }

  function isMember(conversation, user) {
    return Q.denodeify(collaborationModule.member.isMember)(conversation, {objectType: OBJECT_TYPES.USER, id: String(user._id)});
  }

  function isManager(conversation, user) {
    return Q.denodeify(collaborationModule.member.isManager)(OBJECT_TYPES.CONVERSATION, conversation, user);
  }

  function join(conversation, user) {
    return Q.denodeify(collaborationModule.member.join)(OBJECT_TYPES.CONVERSATION, conversation, user, user, user);
  }
};
