'use strict';

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const utils = require('./utils')(dependencies, lib);

  return {
    getChannels
  };

  function getChannels(req, res) {
    lib.conversation.getChannels(req.query, (err, result) => {
      if (err) {
        logger.error('Error while getting conversations', err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: 'Error while getting channels'
          }
        });
      }

      utils.sendConversationResult(result, req.user, res);
    });
  }
};
