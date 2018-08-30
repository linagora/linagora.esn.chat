'use strict';

const Q = require('q');

module.exports = dependencies => {

  const mongoose = dependencies('db').mongo.mongoose;
  const globalPubsub = dependencies('pubsub').global;
  const userSubscribedPrivateConversation = mongoose.model('ChatUserSubscribedPrivateConversation');
  const conversation = require('./conversation')(dependencies);
  const { MEMBER_UNSUBSCRIBED_CONVERSATION } = require('./constants').NOTIFICATIONS;

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
      {upsert: true, new: true})
      .exec();
  }

  function store(userId, conversationIds) {
    return get(userId)
      .then(subscribedPrivateConversation => {
        if (!subscribedPrivateConversation) {
          return _findOneAndUpdate(userId, conversationIds);
        }

        const unsubscribedIds = subscribedPrivateConversation.conversations.filter(conversationId => (conversationIds.indexOf(String(conversationId)) < 0));

        subscribedPrivateConversation.conversations = conversationIds;

        return subscribedPrivateConversation.save()
          .then(saved => {
            if (unsubscribedIds.length > 0) {
              globalPubsub.topic(MEMBER_UNSUBSCRIBED_CONVERSATION).publish({ userId, conversationIds: unsubscribedIds });
            }

            return saved;
          });
      });
  }
};
