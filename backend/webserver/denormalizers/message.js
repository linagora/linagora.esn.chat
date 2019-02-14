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
    denormalizeMessages,
    denormalizeStarredMessage,
    denormalizeStarredMessages
  };

  function denormalizeAttachment(attachment) {
    return getUser(attachment.creator).then(user => {
      attachment.creator = user;

      return attachment;
    });
  }

  function denormalizeStarredMessage(ressourceLinkObject) {
    return Q.denodeify(lib.message.getById)(ressourceLinkObject.target.id)
      .then(message => {
        if (typeof message.toObject === 'function') {
          message = message.toObject();
        }
        message.isStarred = true;
        ressourceLinkObject = message;

        return ressourceLinkObject;
      });
  }

  function denormalizeStarredMessages(ressourceLinkObjects) {
    return Q.all(ressourceLinkObjects.map(denormalizeStarredMessage));
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
      }).then(denormalizeUser.denormalize);
  }

  function denormalizeMessage(message, user) {
    return Promise.all([denormalizeUser.denormalize(message.creator), lib.message.isStarredBy(message, user)])
      .then(results => {
        if (typeof message.toObject === 'function') {
          message = message.toObject();
        }

        message.creator = results[0];
        message.isStarred = results[1];

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
