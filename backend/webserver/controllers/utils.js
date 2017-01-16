'use strict';

const Q = require('q');

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const denormalize = require('../denormalizers/conversation')(dependencies, lib);

  return {
    sendConversationResult,
    sendConversationsResult,
    sendHTTP500Error
  };

  function sendConversationResult(conversation, res, status = 200) {
    if (Array.isArray(conversation)) {
      return sendConversationsResult(conversation, res, status);
    }

    return denormalize(conversation).then(denormalized => {
      res.status(status).json(denormalized);
    }, err => {
      logger.error('Can not denormalize conversation', err);
      sendHTTP500Error('Can not denormalize conversation', res);
    });
  }

  function sendConversationsResult(conversations, res, status = 200) {
    return Q.all(conversations.map(conversation => denormalize(conversation))).then(denormalized => {
      res.status(status).json(denormalized);
    }, err => {
      logger.error('Can not denormalize conversations', err);
      sendHTTP500Error('Can not denormalize conversation', res);
    });
  }

  function sendHTTP500Error(details, res) {
    res.status(500).json({
      error: {
        code: 500,
        message: 'Server Error',
        details
      }
    });
  }
};
