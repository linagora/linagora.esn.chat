'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Q = require('q');

describe('The conversation middleware', function() {

  let dependencies, lib, req, res;

  beforeEach(function() {
    req = {
      user: {
        domains: [{domain_id: 1}, {domain_id: 2}]
      }
    };
    res = {};
    lib = {
      conversation: {},
      members: {}
    };
    dependencies = this.moduleHelpers.dependencies;
  });

  function getMiddleware() {
    return require('../../../../backend/webserver/middlewares/conversation')(dependencies, lib);
  }

  describe('The assertDefaultChannels function', function() {
    it('should create as many channels as there are user domains', function(done) {
      lib.conversation.createDefaultChannel = sinon.spy(function(options, callback) {
        callback(null, {_id: options.domainId});
      });

      res.status = sinon.spy(function() {
        return {
          json: function() {
            done(new Error('I failed'));
          }
        };
      });

      getMiddleware().assertDefaultChannels(req, res, function() {
        expect(res.status).to.not.have.been.called;
        expect(lib.conversation.createDefaultChannel).to.have.been.calledTwice;
        done();
      });
    });

    it('should send back 500 when channel can not be created', function(done) {
      lib.conversation.createDefaultChannel = sinon.spy(function(options, callback) {
        callback(new Error('Failed to create channel'));
      });

      res.status = function(status) {
        expect(status).to.equals(500);

        return {
          json: function(json) {
            expect(lib.conversation.createDefaultChannel).to.have.been.called;
            expect(json).to.deep.equals({
              error: {
                code: 500,
                message: 'Server Error',
                details: 'Error while creating default channel'
              }
            });
            done();
          }
        };
      };

      getMiddleware().assertDefaultChannels(req, res, function() {
        done(new Error('I failed'));
      });
    });
  });

  describe('The assertUserIsMemberOfDefaultChannels function', function() {
    it('should join default channel when user is not member', function(done) {
      lib.conversation.getDefaultChannel = sinon.spy(function(options, callback) {
        callback(null, {_id: 1});
      });
      lib.members.isMember = sinon.spy(function() {
        return Q.when(false);
      });
      lib.members.join = sinon.spy(function() {
        return Q.when(true);
      });

      res.status = sinon.spy(function() {
        return {
          json: function() {
            done(new Error('I failed'));
          }
        };
      });

      getMiddleware().assertUserIsMemberOfDefaultChannels(req, res, function() {
        expect(lib.conversation.getDefaultChannel).to.have.been.called;
        expect(lib.members.isMember).to.have.been.called;
        expect(lib.members.join).to.have.been.called;
        done();
      });
    });

    it('should send back HTTP 500 when getDefaultChannel fails', function(done) {
      lib.conversation.getDefaultChannel = sinon.spy(function(options, callback) {
        return callback(new Error('Failed to create channel'));
      });
      lib.members.isMember = sinon.spy();
      lib.members.join = sinon.spy();

      res.status = function(status) {
        expect(status).to.equals(500);

        return {
          json: function(json) {
            expect(lib.conversation.getDefaultChannel).to.have.been.called;
            expect(lib.members.isMember).to.not.have.been.called;
            expect(lib.members.join).to.not.have.been.called;
            expect(json).to.deep.equals({
              error: {
                code: 500,
                message: 'Server Error',
                details: 'Error while joining default channel'
              }
            });
            done();
          }
        };
      };

      getMiddleware().assertUserIsMemberOfDefaultChannels(req, res, function() {
        done(new Error('I failed'));
      });
    });

    it('should send back HTTP 500 when isMember fails', function(done) {
      lib.conversation.getDefaultChannel = sinon.spy(function(options, callback) {
        return callback(null, {_id: options.domainId});
      });
      lib.members.isMember = sinon.spy(function() {
        return Q.reject(new Error(('I failed')));
      });
      lib.members.join = sinon.spy();

      res.status = function(status) {
        expect(status).to.equals(500);

        return {
          json: function(json) {
            expect(lib.conversation.getDefaultChannel).to.have.been.called;
            expect(lib.members.isMember).to.have.been.called;
            expect(lib.members.join).to.not.have.been.called;
            expect(json).to.deep.equals({
              error: {
                code: 500,
                message: 'Server Error',
                details: 'Error while joining default channel'
              }
            });
            done();
          }
        };
      };

      getMiddleware().assertUserIsMemberOfDefaultChannels(req, res, function() {
        done(new Error('I failed'));
      });
    });

    it('should send back HTTP 500 when a join fails', function(done) {
      lib.conversation.getDefaultChannel = sinon.spy(function(options, callback) {
        return callback(null, {_id: options.domainId});
      });
      lib.members.isMember = sinon.spy(function() {
        return Q.when(false);
      });
      lib.members.join = sinon.spy(function() {
        return Q.reject('I failed');
      });

      res.status = function(status) {
        expect(status).to.equals(500);

        return {
          json: function(json) {
            expect(lib.conversation.getDefaultChannel).to.have.been.called;
            expect(lib.members.isMember).to.have.been.called;
            expect(lib.members.join).to.have.been.called;
            expect(json).to.deep.equals({
              error: {
                code: 500,
                message: 'Server Error',
                details: 'Error while joining default channel'
              }
            });
            done();
          }
        };
      };

      getMiddleware().assertUserIsMemberOfDefaultChannels(req, res, function() {
        done(new Error('I failed'));
      });
    });
  });
});
