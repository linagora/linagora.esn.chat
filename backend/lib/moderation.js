'use strict';

function filterModeratedMessages(messages) {
  return messages.filter(function(message) {
    return !message.moderate;
  });
}
module.exports.filterModeratedMessages = filterModeratedMessages;

function filterModeratedConversations(conversations) {
  return conversations.filter(function(conversation) {
    return !conversation.moderate;
  });
}
module.exports.filterModeratedConversations = filterModeratedConversations;

function isModerated(object) {
  return object.moderate;
}
module.exports.isModerated = isModerated;
