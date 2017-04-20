'use strict';

const HomePage = require('../pages/home');
const EC = protractor.ExpectedConditions;

module.exports = function() {
    const homePage = new HomePage();

    this.Then('I can see Channel List', function() {
        return this.expect(homePage.asidePannel.isDisplayed()).to.eventually.equal(true);
    });
    this.Then('I am redirected to Add Channel page', function() {
        return browser.waitForAngular().then(() =>
            this.expect(EC.urlContains('/#/chat/channels/add')()).to.eventually.equal(true)
        );
    });

    this.Then('I see Add Channel form', function() {
        return this.expect(homePage.createChannelForm.isDisplayed()).to.eventually.equal(true);
    });

    this.Then('the new Channel is added and selected with name "$name"', function(name) {
        return this.expect(homePage.currentChannelName.getText()).to.eventually.equal(name);
    });

};
