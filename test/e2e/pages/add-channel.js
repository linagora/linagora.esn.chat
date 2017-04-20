'use strict';

module.exports = function() {

  this.nameInput = element(by.model('ctrl.conversation.name'));
  this.topicInput = element(by.model('ctrl.conversation.topic'));
  this.purposeInput = element(by.model('ctrl.conversation.purpose'));
  this.createChannelBtn = element(by.css('.right-container chat-subheader-button button'));

};
