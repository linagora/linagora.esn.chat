'use strict';

module.exports = dependencies => {

  const mongoose = dependencies('db').mongo.mongoose;
  const userSubscribedPrivateConversation = mongoose.model('ChatUserSubscribedPrivateConversation');

  return {
    get
  };

  function get(userId) {
    return userSubscribedPrivateConversation.findById(userId);
  }
};
