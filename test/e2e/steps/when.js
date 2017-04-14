'use strict';

const HomePage = require('../pages/home');
const AddChannelPage = require('../pages/add-channel');

module.exports = function() {
    const homePage = new HomePage();
    const addChannelPage = new AddChannelPage();

    this.When('I click on Add Channel button', function() {
        return homePage.createChannelBtn.click();
    });
    this.When('I fill name with "$name"', function(name) {
        return addChannelPage.nameInput.sendKeys(name);
    });
    this.When('I fill topic with "$topic"', function(topic) {
        return addChannelPage.topicInput.sendKeys(topic);
    });
    this.When('I fill purpose with "$purpose"', function(purpose) {
        return addChannelPage.purposeInput.sendKeys(purpose);
    });

    this.When('I click on Create Channel button', function() {
        return addChannelPage.createChannelBtn.click();
    });
};
