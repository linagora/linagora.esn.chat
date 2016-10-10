'use strict';

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');

  return {
    load,
    canRead
  };

  function canRead(req, res, next) {
    next();
  }

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
};
