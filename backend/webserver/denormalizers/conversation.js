'use strict';

const Q = require('q');

module.exports = function(dependencies, lib) {

  const denormalizeUser = dependencies('denormalizeUser');

  return denormalize;

  function denormalize(conversation) {
    if (!conversation) {
      return Q({});
    }

    if (typeof conversation.toObject === 'function') {
      conversation = conversation.toObject();
    }

    return Q.allSettled([
      denormalizeMembers(conversation)
    ]).spread(function(members) {
      conversation.members = members.state === 'fulfilled' ? members.value || [] : [];

      return conversation;
    });
  }

  function denormalizeMember(member) {
    return denormalizeUser.denormalize(member);
  }

  function denormalizeMembers(conversation) {
    return lib.members.getMembers(conversation).then(members => Q.all(members.map(denormalizeMember)));
  }
};
