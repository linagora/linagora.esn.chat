'use strict';

module.exports = (dependencies, lib) => {

  const logger = dependencies('logger');
  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Types.ObjectId;
  const utils = require('./utils')(dependencies, lib);

  return {
    get,
    store
  };

  function get(req, res) {
    lib.userSubscribedPrivateConversation.get(req.user._id)
    .then(conversationIds => {
      if (conversationIds) {
        return lib.userSubscribedPrivateConversation.getByIds(conversationIds.conversations);
      }

      return [];
    })
    .then(conversationsObject =>
      utils.sendConversationResult(conversationsObject, req.user, res)
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

  function store(req, res) {
    if (!req.body || !Array.isArray(req.body.conversationIds)) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'You should provide the private conversations ids array'
        }
      });
    }
    for (var i = 0; i < req.body.conversationIds.length; i++) {
      if (!ObjectId.isValid(req.body.conversationIds[i])) {
        return res.status(400).json({
          error: {
            code: 400,
            message: 'Bad request',
            details: 'You should provide valid ids array'
          }
        });
      }
    }

    lib.userSubscribedPrivateConversation.store(req.user._id, req.body.conversationIds).then(conversationsObject =>
      res.status(200).json(conversationsObject.conversations)
    )
    .catch(error => {
      logger.error('Error while storing subscribed private conversations', error);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: 'Error while storing subscribed private conversations'
        }
      });
    });
  }
};
