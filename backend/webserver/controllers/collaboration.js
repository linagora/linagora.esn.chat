'use strict';

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');
  const utils = require('./utils')(dependencies, lib);

  return {
    listConversationsForUser
  };

  function listConversationsForUser(req, res) {
    lib.collaboration.listForUser(req.user, (err, conversations) => {
      if (err) {
        const msg = 'Error while getting conversations for collaborations';

        logger.error(msg, err);

        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: msg
          }
        });
      }

      utils.sendConversationsResult(conversations, res);
    });
  }
};
