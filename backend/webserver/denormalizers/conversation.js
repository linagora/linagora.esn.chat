'use strict';

const Q = require('q');
const CONSTANTS = require('../../lib/constants');
const MEMBER_STATUS = CONSTANTS.MEMBER_STATUS;
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies, lib) {

  return denormalize;

  function denormalize(conversation, user) {
    if (!conversation) {
      return Q({});
    }

    if (typeof conversation.toObject === 'function') {
      conversation = conversation.toObject();
    }

    return Q.allSettled([
      lib.members.isMember(conversation, user),
      lib.members.countMembers(conversation)
    ]).spread(function(isMember, numberOfMembers) {
      conversation.member_status = isMember.state === 'fulfilled' ? (isMember.value ? MEMBER_STATUS.MEMBER : MEMBER_STATUS.NONE) || MEMBER_STATUS.NONE : MEMBER_STATUS.NONE;
      conversation.members_count = numberOfMembers.state === 'fulfilled' ? numberOfMembers.value || 0 : 0;

      if (conversation.type !== CONVERSATION_TYPE.DIRECT_MESSAGE) {
        delete conversation.members;
      }

      return conversation;
    });
  }
};
