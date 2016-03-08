'use strict';

module.exports = function(dependencies) {

  function getMessages(req, res) {
    return res.status(200).json([]);
  }

  return {
    getMessages: getMessages
  };

};
