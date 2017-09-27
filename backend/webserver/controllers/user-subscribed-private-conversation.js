'use strict';

module.exports = (dependencies, lib) => {

  const logger = dependencies('logger');

  return {
    getUserSubscribedPrivateConversations
  };

  function getUserSubscribedPrivateConversations(req, res) {
    lib.userSubscribedPrivateConversation.get(req.user._id).then(conversationsObject => {

      return res.status(200).json((conversationsObject && conversationsObject.conversations) ? conversationsObject.conversations : []);
    })
    .catch(() => {
      logger.error('Error while getting subscribed private conversations');

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: 'Error while getting subscribed private conversations'
        }
      });
    });
  }
};
