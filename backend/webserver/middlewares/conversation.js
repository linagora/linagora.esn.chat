'use strict';

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');

  return {
    canDelete,
    canRead,
    canUpdate,
    canWrite,
    load
  };


  function canDelete() {

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

  function canUpdate() {

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


};
