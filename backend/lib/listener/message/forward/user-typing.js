'use strict';

const CONSTANTS = require('../../../constants');

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const ChatMessage = mongoose.model('ChatMessage');

  return function(data, callback) {
    (new ChatMessage(data)).populate('creator', CONSTANTS.SKIP_FIELDS.USER, (err, message) => {
      if (err) {
        return callback(err);
      }
      const result = message.toJSON();

      result.state = data.state;
      callback(null, result);
    });
  };
};
