'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

describe('The domain lib', function() {
  let domain, dependencies, user, callback, domainModule;

  beforeEach(function() {
    user = {_id: 1};
    domain = {_id: 2};
    domainModule = {
      userIsDomainAdministrator: sinon.spy(function(user, domain, callback) {
        callback();
      }),
      load: sinon.spy(function(domainId, callback) {
        callback();
      })
    };
    callback = function() {};

    this.moduleHelpers.addDep('domain', domainModule);
    dependencies = this.moduleHelpers.dependencies;
  });

  function getModule() {
    return require('../../../backend/lib/domain')(dependencies);
  }

  describe('The userIsDomainAdministrator function', function(done) {
    it('should call the domainModule.userIsDomainAdministrator function with the right parameters', function() {
      getModule().userIsDomainAdministrator(user, domain).then(function() {
        expect(domainModule.userIsDomainAdministrator).to.have.been.calledWith(user, domain, callback);
        done();
      }, done);
    });
  });

  describe('The load function', function(done) {
    it('should call the domainModule.load function with the right parameters', function() {
      getModule().load(domain._id).then(function() {
        expect(domainModule.load).to.have.been.calledWith(domain._id, callback);
        done();
      }, done);
    });
  });
});
