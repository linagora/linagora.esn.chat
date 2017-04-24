'use strict';

const Q = require('q');

module.exports = function(dependencies, lib) {

  const denormalizeUser = dependencies('denormalizeUser');
  const userModule = dependencies('user');
  const logger = dependencies('logger');

  return {
    denormalizeAttachment,
    denormalizeAttachments,
    denormalizeMessage,
    denormalizeMessages
  };

  function denormalizeAttachment(attachment) {
    return getUser(attachment.creator).then(user => {
      attachment.creator = user;

      return attachment;
    });
  }

  function denormalizeAttachments(attachments) {
    return Q.all(attachments.map(denormalizeAttachment));
  }

  function getUser(userId) {
    return Q.denodeify(userModule.get)(userId)
      .then(user => {
        if (!user) {
          return {_id: userId};
        }

        return user;
      }).then(denormalizeUser);
  }

  function denormalizeMessage(message, user) {
    return lib.message.isStarredBy(message, user)
      .then(isStarred => {
        if (typeof message.toObject === 'function') {
          message = message.toObject();
        }

        message.isStarred = isStarred;

        return message;
      })
      .catch(err => {
        logger.error(`Error when denormalize the message ${message._id}`, err);

        return Q.reject(err);
      });
  }

  function denormalizeMessages(messages, user) {
    return Q.all(messages.map(message => denormalizeMessage(message, user)));
  }
};
