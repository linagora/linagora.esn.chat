'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Q = require('q');
const { CONVERSATION_TYPE, CONVERSATION_MODE } = require('../../../../backend/lib/constants');

describe('The conversation middleware', function() {

  let dependencies, lib, req, res, user;

  beforeEach(function() {
    req = {
      user: {
        domains: [{domain_id: 1}, {domain_id: 2}]
      },
      params: {}
    };
    res = {};
    lib = {
      conversation: {},
      members: {}
    };
    user = {
      get: sinon.spy(function(memberId, callback) {
        callback();
      })
    };
    this.moduleHelpers.addDep('user', user);
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

  describe('The loadMember function', function() {
    it('should send back HTTP 400 when member_id is not defined', function(done) {
      res.status = function(status) {
        expect(status).to.equals(400);

        return {
          json: function(json) {
            expect(user.get).to.not.have.been.called;
            expect(json).to.deep.equals({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'uuid or email missing'
              }
            });

            done();
          }
        };
      };

      getMiddleware().loadMember(req, res, function() {
        done(new Error('I failed'));
      });
    });

    it('should send back HTTP 500 when member_id is not defined', function(done) {
      req.params = { member_id: 'member_id' };
      user = {
        get: sinon.spy(function(memberId, callback) {
          callback(new Error('Failed to find user'));
        })
      };

      this.moduleHelpers.addDep('user', user);
      dependencies = this.moduleHelpers.dependencies;

      res.status = function(status) {
        expect(status).to.equals(500);

        return {
          json: function(json) {
            expect(user.get).to.have.been.called;
            expect(json).to.deep.equals({
              error: {
                code: 500,
                message: 'Server error',
                details: 'Failed to find user'
              }
            });

            done();
          }
        };
      };

      getMiddleware().loadMember(req, res, function() {
        done(new Error('I failed'));
      });
    });

    it('should send back HTTP 404 when member_id is not defined', function(done) {
      req.params = { member_id: 'member_id' };
      user = {
        get: sinon.spy(function(memberId, callback) {
          callback();
        })
      };

      this.moduleHelpers.addDep('user', user);
      dependencies = this.moduleHelpers.dependencies;

      res.status = function(status) {
        expect(status).to.equals(404);

        return {
          json: function(json) {
            expect(user.get).to.have.been.called;
            expect(json).to.deep.equals({
              error: {
                code: 404,
                message: 'Not found',
                details: 'User not found'
              }
            });

            done();
          }
        };
      };

      getMiddleware().loadMember(req, res, function() {
        done(new Error('I failed'));
      });
    });

    it('should send back HTTP 200', function(done) {
      const userInfo = {foo: 'bar'};

      req.params = { member_id: 'member_id' };
      user = {
        get: sinon.spy(function(memberId, callback) {
          callback(null, userInfo);
        })
      };

      this.moduleHelpers.addDep('user', user);
      dependencies = this.moduleHelpers.dependencies;

      getMiddleware().loadMember(req, res, function() {
        expect(user.get).to.have.been.called;
        expect(req.member).to.equal(userInfo);
        done();
      });
    });
  });

  describe('The canCreate function', function() {
    it('should send back HTTP 400 if user creat a direct message conversation that only has himself as member', function(done) {
      req.user = { _id: 'creatorid' };
      req.body = {
        type: CONVERSATION_TYPE.DIRECT_MESSAGE,
        mode: CONVERSATION_MODE.CHANNEL,
        members: ['creatorid']
      };

      res.status = function(status) {
        expect(status).to.equals(400);

        return {
          json: function(json) {
            expect(json).to.deep.equals({
              error: {
                code: 400,
                message: 'Bad request',
                details: 'Can not create a direct message conversation with only the creator'
              }
            });

            done();
          }
        };
      };

      getMiddleware().canCreate(req, res, () => {
        done(new Error('Test failed'));
      });
    });
  });
});
