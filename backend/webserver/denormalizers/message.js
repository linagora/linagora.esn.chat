'use strict';

const Q = require('q');

module.exports = function(dependencies) {

  const denormalizeUser = dependencies('denormalizeUser');
  const userModule = dependencies('user');

  return {
    denormalizeAttachment,
    denormalizeAttachments
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
};
