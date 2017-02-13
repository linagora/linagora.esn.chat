'use strict';

const CONSTANTS = require('../../../constants');

module.exports = function(dependencies) {

  const pubsub = dependencies('pubsub').global;

  return function(data) {
    data.message.user_mentions && data.message.user_mentions.forEach(mention => {
      pubsub.topic(CONSTANTS.NOTIFICATIONS.USERS_MENTION).publish({message: data.message, for: mention});
    });
  };

};
