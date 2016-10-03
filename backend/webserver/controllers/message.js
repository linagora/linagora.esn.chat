'use strict';

module.exports = function(dependencies, lib) {

  function getMessages(req, res) {
    lib.message.getMessages(req.params.channel, {}, (err, results) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details: err.message || 'Error while getting messages'
          }
        });
      }

      return res.status(200).json(results);
    });
  }

  function getMessage(req, res) {
    lib.message.getMessage(req.params.id, (err, message) => {
      if (err) {
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

  return {
    getMessage,
    getMessages
  };
};
