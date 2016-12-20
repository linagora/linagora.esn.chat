'use strict';

const Q = require('q');

module.exports = function(dependencies, lib) {

  const logger = dependencies('logger');

  return {
    get,
    getForConversation,
    search
  };

  function get(req, res) {
    res.status(200).json(req.message);
  }

  function getForConversation(req, res) {
    lib.message.getForConversation(req.conversation._id, req.query, (err, results) => {
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

  function search(req, res) {

    function hydrateMessage(message) {
      return lib.message.getByIdAndPopulate(message._id, ['creator', 'user_mentions', 'channel']);
    }

    function sendError(err) {
      logger.error('Error while searching messages', err);
      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: err.message || 'Error while searching messages'
        }
      });
    }

    lib.message.searchForUser(req.user, {search: req.query.search}, (err, result) => {
      if (err) {
        return sendError(err);
      }

      res.header('X-ESN-Items-Count', result.total_count || 0);
      Q.all(result.list.map(hydrateMessage)).then(messages => res.status(200).json(messages), sendError);
    });
  }
};
