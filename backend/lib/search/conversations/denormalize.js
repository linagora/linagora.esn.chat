'use strict';

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const ChatConversation = mongoose.model('ChatConversation');

  return {
    denormalize,
    getId
  };

  function getId(conversation) {
    return conversation._id;
  }

  function denormalize(conversation) {
    const options = {virtuals: true, depopulate: true, transform: transform};

    function transform(doc, ret) {
      const hide = ['__v', '_id', 'schemaVersion', 'moderate', 'domain', 'members', 'creator', 'last_message'];

      ret.id = getId(ret);
      hide.map(element => {delete ret[element];});
    }

    return conversation instanceof ChatConversation ? conversation.toObject(options) : new ChatConversation(conversation).toObject(options);
  }
};
