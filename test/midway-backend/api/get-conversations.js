'use strict';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const Q = require('q');
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;

describe('GET /chat/api/conversations', function() {
  let helpers, app, lib;
  let user, domain;
  const password = 'secret';

  beforeEach(function(done) {
    const self = this;

    helpers = this.helpers;
    lib = self.helpers.modules.current.lib.lib;
    app = self.helpers.modules.current.app;

    const deployOptions = {
      fixtures: path.normalize(`${__dirname}/../fixtures/deployments`)
    };

    helpers.api.applyDomainDeployment('chatModule', deployOptions, helpers.callbacks.noErrorAnd(models => {
      user = models.users[0];
      domain = models.domain;
      lib = helpers.modules.current.lib.lib;

      done();
    }));
  });

  const generateMemberFromUser = user => ({
    member: {
      id: String(user._id || user),
      objectType: 'user'
    }
  });

  it('should return a default channel', function(done) {
    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).get('/chat/api/conversations'));

      req.expect('Content-Type', /json/);
      req.expect(200);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body.length).to.equal(1);
        expect(res.body).to.shallowDeepEqual([{name: CONSTANTS.DEFAULT_CHANNEL.name}]);
        done();
      }));
    }));
  });

  it('should not create the default channel if already exists', function(done) {
    const options = {
      domainId: domain._id
    };

    Q.denodeify(lib.conversation.createDefaultChannel)(options).then(test, done);

    function test(defaultChannel) {
      if (!defaultChannel) {
        return done(new Error('Default channel should have been created'));
      }

      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get('/chat/api/conversations'));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(1);
          expect(res.body).to.shallowDeepEqual([{_id: String(defaultChannel._id), name: CONSTANTS.DEFAULT_CHANNEL.name}]);
          done();
        }));
      }));
      }
  });

  it('should return an array of non moderated channels', function(done) {
    function execTest(channel1, channel2, channel3) {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get('/chat/api/conversations'));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(3);

          const channel1InBody = res.body.find(conversation => (conversation._id === String(channel1._id)));
          const channel2InBody = res.body.find(conversation => (conversation._id === String(channel2._id)));
          const channel3InBody = res.body.find(conversation => (conversation._id === String(channel3._id)));

          expect(channel1InBody).to.not.exist;
          expect(channel2InBody).to.exist;
          expect(channel3InBody).to.exist;

          done();
        }));
      }));
    }

    Q.all([
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        moderate: true
      }),
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      }),
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      })
    ])
    .spread(execTest)
    .catch(done);
  });

  it('should return an array open channels', function(done) {
    function execTest(channel1, channel2, channel3) {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get('/chat/api/conversations'));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(3);
          expect(res.body).to.shallowDeepEqual([{_id: String(channel1._id)}, {_id: String(channel3._id)}, {name: CONSTANTS.DEFAULT_CHANNEL.name}]);
          done();
        }));
      }));
    }

    Q.all([
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      }),
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      }),
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      })
    ]).spread(execTest).catch(done);
  });

  it('should return the number of conversations defined by the limit parameter', function(done) {
    function execTest() {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get('/chat/api/conversations?limit=2'));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.headers['x-esn-items-count']).to.equal('4');
          expect(res.body.length).to.equal(2);
          done();
        }));
      }));
    }

    Q.all([
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      }),
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      }),
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      })
    ])
    .then(execTest)
    .catch(done);
  });

  it('should offset results from the offset parameter', function(done) {
    function execTest() {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get('/chat/api/conversations?offset=3'));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.headers['x-esn-items-count']).to.equal('4');
          expect(res.body.length).to.equal(1);
          done();
        }));
      }));
    }

    Q.all([
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      }),
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      }),
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        mode: CONVERSATION_MODE.CHANNEL,
        domain_ids: [domain._id]
      })
    ])
    .then(execTest)
    .catch(done);
  });

  it('should return only unread conversations if unread query param = true', function(done) {
    const numOfMessage = 2;
    const conversationJSON1 = {
      type: CONVERSATION_TYPE.OPEN,
      members: [generateMemberFromUser(user)],
      numOfMessage,
      memberStates: {
        [String(user._id)]: {
          numOfReadMessages: 1,
          numOfUnseenMentions: 0
        }
      }
    };
    const conversationJSON2 = {
      type: CONVERSATION_TYPE.OPEN,
      members: [generateMemberFromUser(user)],
      numOfMessage,
      memberStates: {
        [String(user._id)]: {
          numOfReadMessages: numOfMessage,
          numOfUnseenMentions: 0
        }
      }
    };

    Q.all([
      Q.denodeify(lib.conversation.create)(conversationJSON1),
      Q.denodeify(lib.conversation.create)(conversationJSON2)
    ])
    .spread(conversation1 => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get('/chat/api/user/conversations?unread=true'));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(1);
          expect(res.body).to.shallowDeepEqual([{
            _id: String(conversation1._id)
          }]);
          done();
        }));
      }));
    })
    .catch(done);
  });
});
