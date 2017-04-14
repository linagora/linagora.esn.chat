'use strict';

const HomePage = require('../pages/home');

module.exports = function() {
  const homePage = new HomePage();

  this.Given('I am on Chat module page', function() {
    homePage.clickOnModuleInMenu();
    return this.expect(browser.getCurrentUrl()).to.eventually.match(/\/#\/chat/);
  });

};
