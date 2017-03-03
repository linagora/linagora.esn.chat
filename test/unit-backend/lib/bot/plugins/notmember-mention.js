'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const Q = require('q');

describe('The notmember-mention bot plugin', function() {
  let dependencies, lib, bot, userModule;

  beforeEach(function() {
    bot = {
      listen: sinon.spy()
    };
    lib = {
      conversation: {},
      members: {},
      message: {
        parseMention: function() {}
      }
    };
    userModule = {};
    this.moduleHelpers.addDep('user', userModule);
    dependencies = this.moduleHelpers.dependencies;
  });

  function getModule() {
    return require('../../../../../backend/lib/bot/plugins/notmember-mention')(dependencies, lib);
  }

  describe('The request handler function', function() {
    let requestHandler;

    beforeEach(function() {
      getModule()(bot);
      requestHandler = bot.listen.firstCall.args[0];
    });

    it('should resolve with false and request message does not have mentions', function(done) {
      const request = {
        message: {}
      };

      requestHandler(request).then(function(result) {
        expect(result).to.be.false;
        done();
      }, done);
    });

    it('should resolve with false when request message does have empty mentions', function(done) {
      const request = {
        message: {
          user_mentions: []
        }
      };

      requestHandler(request).then(function(result) {
        expect(result).to.be.false;
        done();
      }, done);
    });

    it('should reject when conversation is not found', function(done) {
      const request = {
        message: {
          channel: 123,
          user_mentions: [1, 2, 3]
        }
      };

      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback();
      });

      requestHandler(request).then(done, function(err) {
        expect(lib.conversation.getById).to.have.been.calledWith(request.message.channel, sinon.match.func);
        expect(err.message).to.match(/Can not find conversation/);
        done();
      });
    });

    it('should reject when conversation.getById rejects', function(done) {
      const error = new Error('Fail to get conversation');
      const request = {
        message: {
          channel: 123,
          user_mentions: [1, 2, 3]
        }
      };

      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback(error);
      });

      requestHandler(request).then(done, function(err) {
        expect(lib.conversation.getById).to.have.been.calledWith(request.message.channel, sinon.match.func);
        expect(err.message).to.equal(error.message);
        done();
      });
    });

    it('should resolve with empty array when all the mentions are conversation members', function(done) {
      const conversation = {_id: 1, name: 'My conversation'};
      const request = {
        message: {
          channel: 123,
          user_mentions: [1, 2, 3]
        }
      };

      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback(null, conversation);
      });

      lib.members.isMember = sinon.spy(function() {
        return Q.when(true);
      });

      requestHandler(request).then(function(result) {
        expect(lib.conversation.getById).to.have.been.calledWith(request.message.channel, sinon.match.func);
        expect(lib.members.isMember).to.have.been.calledThrice;
        expect(result).to.deep.equals([]);
        done();
      }, done);
    });

    it('should resolve with users who are not conversation members', function(done) {
      const conversation = {_id: 1, name: 'My conversation'};
      const request = {
        message: {
          channel: 123,
          user_mentions: [1, 2, 3]
        }
      };

      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback(null, conversation);
      });

      lib.members.isMember = sinon.stub();
      lib.members.isMember.withArgs(conversation, {_id: 1}).returns(Q.when(false));
      lib.members.isMember.returns(Q.when(true));

      requestHandler(request).then(function(result) {
        expect(lib.conversation.getById).to.have.been.calledWith(request.message.channel, sinon.match.func);
        expect(lib.members.isMember).to.have.been.calledThrice;
        expect(result).to.deep.equals([{ userId: 1, isMember: false }]);
        done();
      }, done);
    });
  });

  describe('The response handler function', function() {
    let responseHandler;

    beforeEach(function() {
      getModule()(bot);
      responseHandler = bot.listen.firstCall.args[1];
    });

    it('should call response.reply with valid arguments', function(done) {
      const response = {
        reply: sinon.spy(),
        request: {
          match: [{userId: 1}, {userId: 2}, {userId: 3}]
        }
      };

      userModule.get = sinon.spy(function(id, callback) {
        callback(null, {_id: id});
      });

      responseHandler(response).then(() => {
        expect(userModule.get).to.have.been.calledThrice;
        expect(response.reply).to.have.been.calledOnce;
        expect(response.reply.firstCall.args[0]).to.shallowDeepEqual({
          subtype: 'notmember-mention',
          user_mentions: [{_id: 1}, {_id: 2}, {_id: 3}]
        });
        done();
      }, done);
    });

    it('should not call response.reply if user.get fails', function(done) {
      const error = new Error('I failed');
      const response = {
        reply: sinon.spy(),
        request: {
          match: [1]
        }
      };

      userModule.get = sinon.spy(function(id, callback) {
        callback(error);
      });

      responseHandler(response).then(done, err => {
        expect(err.message).to.equal(error.message);
        expect(response.reply).to.not.have.been.called;
        done();
      });
    });
  });
});
