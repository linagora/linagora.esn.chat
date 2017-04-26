'use strict';

const CONSTANTS = require('../../lib/constants');

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const resourceLinkMiddleware = dependencies('resourceLinkMW');

  return {
    canUnstar,
    canStar,
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

  function canStar(req, res, next) {
    const link = req.link;

    logger.debug('Check the star link', link);

    if (link.target.objectType !== CONSTANTS.OBJECT_TYPES.MESSAGE) {
      logger.debug('Wrong objectType', link.target.objectType);

      return next();
    }

    if (String(req.user._id) !== String(link.source.id)) {

      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'You cannot star a message for someone else'
        }
      });
    }

    lib.message.getById(link.target.id, (err, message) => {
      if (err) {
        logger.error('Error while loading message from message', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting message'
          }
        });
      }
      if (!message) {
        logger.error('Can not find the message to starred');

        return res.status(404).json({
          error: {
            code: 404,
            message: 'message not found',
            details: 'Can not find message to star'
          }
        });
      }

      req.linkable = true;
      next();
    });
  }

  function canUnstar(req, res, next) {
    const link = req.link;

    logger.debug('Check the unstar link', link);

    if (link.target.objectType !== CONSTANTS.OBJECT_TYPES.MESSAGE) {
      logger.debug('Wrong objectType', link.target.objectType);

      return next();
    }
    if (req.user._id !== link.source.id) {

      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'You cannot unstar a message for someone else'
        }
      });
    }
    resourceLinkMiddleware.exists(link).then(exist => {
      if (!exist) {
        logger.error('Error resourceLink does not exist');

        return next();
      }

      req.linkable = true;
      next();
    }).catch(err => {
      logger.error('Error while checking link', err);

      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not check the resourceLink'}});
    });
  }
};
