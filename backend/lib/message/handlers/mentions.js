'use strict';

var CONSTANTS = require('../../constants');

module.exports = function(dependencies) {

  var pubsub = dependencies('pubsub').global;

  return function(data) {
    data.message.user_mentions && data.message.user_mentions.forEach(function(mention) {
      pubsub.topic(CONSTANTS.NOTIFICATIONS.USERS_MENTION).publish({room: data.room, message: data.message, for: mention});
    });
  };

};
