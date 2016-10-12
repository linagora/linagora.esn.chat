'use strict';

const Q = require('q');

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const denormalize = require('../denormalizers/conversation')(dependencies, lib);

  return {
    sendConversationResult,
    sendConversationsResult
  };

  function sendConversationResult(conversation, res, status = 200) {
    if (Array.isArray(conversation)) {
      return sendConversationsResult(conversation, res, status);
    }

    return denormalize(conversation).then(denormalized => {
      res.status(status).json(denormalized);
    }, err => {
      logger.error('Can not denormalize conversation', err);
      res.status(500).json({
        error: {
          status: 500,
          message: 'Server Error',
          details: 'Can not denormalize conversation'
        }
      });
    });
  }

  function sendConversationsResult(conversations, res, status = 200) {
    return Q.all(conversations.map(conversation => denormalize(conversation))).then(denormalized => {
      res.status(status).json(denormalized);
    }, err => {
      logger.error('Can not denormalize conversations', err);
      res.status(500).json({
        error: {
          status: 500,
          message: 'Server Error',
          details: 'Can not denormalize conversations'
        }
      });
    });
  }
};
