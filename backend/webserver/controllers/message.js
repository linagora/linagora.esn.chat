'use strict';

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');

  return {
    get,
    getForConversation
  };

  function get(req, res) {
    res.status(200).json(req.message);
  }

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
};
