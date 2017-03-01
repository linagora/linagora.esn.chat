'use strict';

const Q = require('q');
const SUBTYPE = 'notmember-mention';

module.exports = (dependencies, lib) => bot => {
  const userModule = dependencies('user');

  bot.listen(matchHandler, handler);

  function handler(response) {
    const promises = response.request.match.map(element => Q.denodeify(userModule.get)(element.userId));

    return Q.all(promises)
      .then(users => users.map(sanitizeUser))
      .then(users => response.reply({subtype: SUBTYPE, user_mentions: users}));
  }

  function matchHandler(request) {
    const message = request.message;

    lib.message.parseMention(message);

    if (!message.user_mentions || !message.user_mentions.length) {
      return Q.when(false);
    }

    return Q.denodeify(lib.conversation.getById)(message.channel)
      .then(conversation => {
        if (!conversation) {
          throw new Error(`Can not find conversation ${message.channel}`);
        }

        return conversation;
      })
      .then(conversation => Q.all(message.user_mentions.map(userId => lib.members.isMember(conversation, {_id: userId}).then(isMember => ({userId, isMember})))))
      .then(areMembers => areMembers.filter(isMember => !isMember.isMember));
  }

  // FIXME: We need OP helpers for this, for now this is only available in REST APIs...
  function sanitizeUser(user) {
    const keys = ['_id', 'firstname', 'lastname', 'preferredEmail', 'emails', 'domains'];
    const result = {};

    if (typeof user.toObject === 'function') {
      user = user.toObject({virtuals: true});
    }

    keys.forEach(key => {
      if (user[key]) {
        result[key] = user[key];
      }
    });

    return result;
  }
};
