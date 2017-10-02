'use strict';

module.exports = (dependencies, lib) => {

  const logger = dependencies('logger');

  return {
    getUserSubscribedPrivateConversations
  };

  function getUserSubscribedPrivateConversations(req, res) {
    lib.userSubscribedPrivateConversation.get(req.user._id)
    .then(conversationIds => {
      if (conversationIds) {
        return lib.userSubscribedPrivateConversation.getByIds(conversationIds.conversations);
      }

      return [];
    })
    .then(conversationsObject =>
      res.status(200).json(conversationsObject)
    )
    .catch(error => {
      logger.error('Error while getting subscribed private conversations', error);

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
