'use strict';

module.exports = dependencies => {

  const mongoose = dependencies('db').mongo.mongoose;
  const userSubscribedPrivateConversation = mongoose.model('ChatUserSubscribedPrivateConversation');

  return {
    get,
    store
  };

  function get(userId) {
    return userSubscribedPrivateConversation.findById(userId);
  }

  function _findOneAndUpdate(userId, conversationIds) {
    return userSubscribedPrivateConversation.findOneAndUpdate({_id: userId},
      {$set: {conversations: conversationIds}},
      {upsert: true})
      .exec();
  }

  function store(userId, conversationIds) {
    return _findOneAndUpdate(userId, conversationIds);
  }
};
