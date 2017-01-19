'use strict';

const Q = require('q');
const CONSTANTS = require('./constants');
const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;
const MEMBER_ADDED_IN_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
const MEMBERSHIP_EVENTS = CONSTANTS.NOTIFICATIONS.MEMBERSHIP_EVENTS;

module.exports = function(dependencies) {

  const collaborationModule = dependencies('collaboration');

  const pubsubGlobal = dependencies('pubsub').global;
  const pubsubLocal = dependencies('pubsub').local;
  const channelAddMember = pubsubGlobal.topic(MEMBER_ADDED_IN_CONVERSATION);
  const membershipTopic = pubsubLocal.topic(MEMBERSHIP_EVENTS);

  return {
    countMembers,
    getMembers,
    isMember,
    start
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

  function start() {
    // TODO: Listen to collaboration events and forward events
    //channelAddMember.publish(conversation);
    //membershipTopic.publish({type: CONSTANTS.MEMBERSHIP_ACTION.JOIN, conversationId: conversationId, userId: userId});
  }
};
