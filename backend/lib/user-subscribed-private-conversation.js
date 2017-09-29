'use strict';

const Q = require('q');

module.exports = dependencies => {

  const mongoose = dependencies('db').mongo.mongoose;
  const userSubscribedPrivateConversation = mongoose.model('ChatUserSubscribedPrivateConversation');
  const conversation = require('./conversation')(dependencies);

  return {
    get,
    getByIds,
    store
  };

  function get(userId) {
    return userSubscribedPrivateConversation.findById(userId);
  }

  function getByIds(conversationIds) {

    return Q.all(conversationIds.map(id => getById(id)));

    function getById(conversationId) {

      return Q.denodeify(conversation.getById)(conversationId);
    }
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
