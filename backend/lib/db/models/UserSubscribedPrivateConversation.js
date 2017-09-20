'use strict';

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = mongoose.Schema.ObjectId;

  const UserSubscribedPrivateConversationSchema = new Schema({
    _id: {type: ObjectId, required: true},
    conversations: [ObjectId]
  });

  return mongoose.model('ChatUserSubscribedPrivateConversation', UserSubscribedPrivateConversationSchema);
};
