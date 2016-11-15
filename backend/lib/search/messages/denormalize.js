'use strict';

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const ChatMessage = mongoose.model('ChatMessage');

  return {
    denormalize,
    getId
  };

  function getId(message) {
    return message._id;
  }

  function denormalize(message) {
    const options = {virtuals: true, transform: transform};

    function transform(doc, ret) {
      ret.id = getId(ret);
      delete ret._id;
    }

    return message instanceof ChatMessage ? message.toObject(options) : new ChatMessage(message).toObject(options);
  }
};
