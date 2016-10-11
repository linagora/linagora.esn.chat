'use strict';

const CONSTANTS = require('../../lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const userModule = dependencies('user');

  return {
    canCreate,
    canJoin,
    canLeave,
    canRemove,
    canRead,
    canUpdate,
    canWrite,
    load,
    loadUser
  };

  function canCreate(req, res, next) {
    if (req.body.type === CONVERSATION_TYPE.COLLABORATION) {
      return res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: 'Can not create a collaboration conversation'
        }
      });
    }

    next();
  }

  function canJoin(req, res, next) {
    lib.conversation.permission.userCanJoin(req.user, req.additionalUser, req.conversation).then(join => {
      if (join) {
        return next();
      }

      return res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: `Can not join conversation ${req.conversation.id}`
        }
      });

    }, err => {
      const msg = `Error while checking join rights on conversation ${req.conversation.id}`;

      logger.error(msg, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: msg
        }
      });
    });
  }

  function canLeave(req, res, next) {
    lib.conversation.permission.userCanLeave(req.user, req.additionalUser, req.conversation).then(leave => {
      if (leave) {
        return next();
      }

      return res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: `Can not leave conversation ${req.conversation.id}`
        }
      });

    }, err => {
      const msg = `Error while checking leave rights on conversation ${req.conversation.id}`;

      logger.error(msg, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: msg
        }
      });
    });
  }

  function canRemove(req, res, next) {
    lib.conversation.permission.userCanRemove(req.user, req.conversation).then(removable => {
      if (removable) {
        return next();
      }

      return res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: `Can not remove conversation ${req.conversation.id}`
        }
      });

    }, err => {
      const msg = `Error while checkcing remove rights on conversation ${req.conversation.id}`;

      logger.error(msg, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: msg
        }
      });
    });
  }

  function canRead(req, res, next) {
    lib.conversation.permission.userCanRead(req.user, req.conversation).then(readable => {
      if (readable) {
        return next();
      }

      return res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: `Can not read conversation ${req.conversation.id}`
        }
      });

    }, err => {
      const msg = `Error while checkcing read rights on conversation ${req.conversation.id}`;

      logger.error(msg, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: msg
        }
      });
    });
  }

  function canUpdate(req, res, next) {
    lib.conversation.permission.userCanUpdate(req.user, req.conversation).then(updatable => {
      if (updatable) {
        return next();
      }

      return res.status(403).json({
        error: {
          code: 403,
          message: 'Forbidden',
          details: `Can not update conversation ${req.conversation.id}`
        }
      });

    }, err => {
      const msg = `Error while checkcing update rights on conversation ${req.conversation.id}`;

      logger.error(msg, err);

      return res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: msg
        }
      });
    });
  }

  function canWrite() {

  }

  function load(req, res, next) {
    lib.conversation.getById(req.params.id, (err, conversation) => {
      if (err) {
        logger.error('Error while loading conversation', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: `Error while getting conversation ${req.params.id}`
          }
        });
      }

      if (!conversation) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Not found',
            details: `No such conversation ${req.params.id}`
          }
        });
      }

      req.conversation = conversation;
      next();
    });
  }

  function loadUser(req, res, next) {
    userModule.get(req.params.user_id, (err, user) => {
      if (err) {
        logger.error(`Error while loading user ${req.params.user_id}`, err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: `Error while loading user ${req.params.user_id}`
          }
        });
      }

      if (!user) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Not found',
            details: `Can not find user ${req.params.user_id}`
          }
        });
      }

      req.additionalUser = user;
      next();
    });
  }
};
