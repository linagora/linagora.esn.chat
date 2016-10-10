'use strict';

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');

  return {
    getById,
    getForConversation
  };

  function getForConversation(req, res) {
    lib.message.getForConversation(req.conversation._id, {}, (err, results) => {
      if (err) {
        logger.error('Error while getting messages for conversation %s', req.conversation._id, err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting messages for conversation'
          }
        });
      }

      return res.status(200).json(results);
    });
  }

  function getById(req, res) {
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

      return res.status(200).json(message);
    });
  }
};
