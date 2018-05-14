'use strict';

const Q = require('q');

module.exports = dependencies => {
  const logger = dependencies('logger');
  const conversationLib = require('../../../conversation')(dependencies);

  return function(data) {
    const mentionedUsers = data.message.user_mentions;
    const conversationId = data.message.channel;

    if (!mentionedUsers || mentionedUsers.length === 0) {
      return Q.resolve();
    }

    return Q.ninvoke(conversationLib, 'getById', conversationId)
      .then(conversation => {
        if (!conversation) {
          return Q.reject(new Error(`No such conversation ${conversationId}`));
        }

        const conversationMemberIds = conversation.members.map(member => String(member.member.id));
        const mentionedMemberIds = mentionedUsers.map(mentionedUser => {
          if (conversationMemberIds.indexOf(String(mentionedUser._id)) !== -1) {
            return String(mentionedUser._id);
          }
        }).filter(Boolean);

        if (mentionedMemberIds.length === 0) {
          return;
        }

        return conversationLib.increaseNumberOfUnseenMentionsOfMembers(conversationId, mentionedMemberIds);
      })
      .catch(err => logger.error('Failed to update unseen mentions count of members', err));
  };
};
