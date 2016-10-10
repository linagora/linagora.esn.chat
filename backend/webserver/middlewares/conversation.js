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

  function canRead() {

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
