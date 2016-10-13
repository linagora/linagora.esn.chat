'use strict';

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');

  return {
    checkParameters,
    hasPermission,
    loadCollaboration,
    loadConversation
  };

  function checkParameters(req, res, next) {
    const {id, objectType} = req.params;

    if (!id || !objectType) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'collaboration id and objectType are required'
        }
      });
    }

    next();
  }

  function hasPermission(req, res, next) {
    lib.collaboration.userCanWrite(req.user, req.collaboration, (err, access) => {
      if (err) {
        const msg = `Error while checking permissions on collaboration ${req.collaboration._id} - ${req.collaboration.objectType}`;

        logger.error(msg, err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: msg
          }
        });
      }

      if (!access) {
        return res.status(403).json({
          error: {
            code: 403,
            message: 'Forbidden',
            details: 'User does not have enough rights to access this conversation'
          }
        });
      }

      next();
    });
  }

  function loadCollaboration(req, res, next) {
    const {id, objectType} = req.params;

    if (!id || !objectType) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad request',
          details: 'collaboration id and objectType are required'
        }
      });
    }

    lib.collaboration.getCollaboration({id, objectType}, (err, collaboration) => {
      if (err) {
        const msg = `Error while getting collaboration ${id} - ${objectType}`;

        logger.error(msg, err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: msg
          }
        });
      }

      if (!collaboration) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Not Found',
            details: `Collaboration ${id} - ${objectType} not found`
          }
        });
      }

      req.collaboration = collaboration;
      next();
    });
  }

  function loadConversation(req, res, next) {
    const {id, objectType} = req.params;

    lib.collaboration.getConversation({id, objectType}, (err, conversation) => {
      if (err) {
        const msg = `Error while getting conversation ${id} - ${objectType}`;

        logger.error(msg, err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: msg
          }
        });
      }

      if (!conversation) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Not Found',
            details: `Conversation ${id} - ${objectType} not found`
          }
        });
      }

      req.conversation = conversation;
      next();
    });
  }
};
