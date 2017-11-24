'use strict';

const Q = require('q');

module.exports = function(dependencies) {

  const domainModule = dependencies('domain');

  return {
    userIsDomainAdministrator,
    load
  };

  function userIsDomainAdministrator(user, domain) {
    return Q.denodeify(domainModule.userIsDomainAdministrator)(user, domain);
  }

  function load(domainId) {
    return Q.denodeify(domainModule.load)(domainId);
  }
};
