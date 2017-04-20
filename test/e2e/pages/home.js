'use strict';

module.exports = function() {

  this.asidePannel = element(by.css('.chat-aside'));
  this.channelList = element(by.repeater('conversation in ctrl.chatConversationsStoreService.channels'));
  this.currentChannelName = element.all(by.binding('ctrl.name | esnEmoticonify:{ class: "label-emoji" }')).get(0);
  this.menuButton = element(by.css('#header .application-menu-toggler'));
  this.chatButton = element(by.css('#header .application-menu a[href="/#/chat"]'));
  this.createChannelBtn = element(by.css('.chat-aside-action[href="#/chat/channels/add"]'));
  this.createChannelForm = element(by.css('[name="createChannelForm"]'));

  this.clickOnModuleInMenu = function() {
    return this.menuButton.click().then(this.chatButton.click);
  }.bind(this);
};
