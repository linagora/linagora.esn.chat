'use strict';

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');

  return {
    load,
    loadMessageConversation
  };

  function load(req, res, next) {
    lib.message.getById(req.params.id, (err, message) => {
      if (err) {
        logger.error('Error while getting message %s', req.params.id, err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting message'
          }
        });
      }

      if (!message) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Not found',
            details: `Message ${req.params.id} not found`
          }
        });
      }

      req.message = message;
      next();
    });
  }

  function loadMessageConversation(req, res, next) {
    const message = req.message;

    lib.conversation.getById(message.channel, (err, conversation) => {
      if (err) {
        logger.error('Error while loading conversation from message', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: `Error while getting conversation of message ${req.params.id}`
          }
        });
      }

      if (!conversation) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Not found',
            details: `Can not find conversation for message ${message._id}`
          }
        });
      }

      req.conversation = conversation;
      next();
    });
  }
};
