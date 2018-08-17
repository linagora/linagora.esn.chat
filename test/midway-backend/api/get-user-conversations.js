'use strict';

const Q = require('q');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('GET /chat/api/user/conversations', function() {
  let helpers, app, lib;
  let user;
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

  it('should return all conversations with me inside which are not moderated', function(done) {
    let channel1, channel2;

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      timestamps: { creation: new Date(2e6) },
      members: [generateMemberFromUser(user)]
    }).then(createdConversation => {
      channel1 = createdConversation;

      return Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        moderate: true,
        members: [generateMemberFromUser(user)],
        timestamps: { creation: new Date(1e6) }
      });
    }).then(() =>
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [generateMemberFromUser(user)],
        timestamps: { creation: new Date(1e6) }
      })
    ).then(createdConversation => {
      channel2 = createdConversation;

      return Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [],
        timestamps: { creation: new Date(0) }
      });
    }).then(() => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get('/chat/api/user/conversations'));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(3);
          expect(res.body).to.shallowDeepEqual([
            { _id: String(channel1._id) },
            { _id: String(channel2._id) },
            { name: CONSTANTS.DEFAULT_CHANNEL.name }
          ]);
          done();
        }));
      }));
    }).catch(done);
  });

  it('should not return channel if I am not a member of them yet', function(done) {
    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.OPEN,
      members: []
    }).then(() => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get('/chat/api/user/conversations'));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(1);
          expect(res.body).to.shallowDeepEqual([
            { name: CONSTANTS.DEFAULT_CHANNEL.name }
          ]);
          done();
        }));
      }));
    }).catch(done);
  });

  it('should put conversation with the most recent last message first', function(done) {
    let channel1, channel2;

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: [generateMemberFromUser(user)],
      last_message: {date: new Date(1469605336000)}
    }).then(conversation => {
      channel1 = conversation;

      return Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [generateMemberFromUser(user)],
        last_message: {date: new Date(1469605337000)}
      });
    }).then(conversation => {
      channel2 = conversation;

      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get('/chat/api/user/conversations'));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(3);
          expect(res.body).to.shallowDeepEqual([
            { _id: String(channel2._id) },
            { _id: String(channel1._id) },
            { name: CONSTANTS.DEFAULT_CHANNEL.name }
          ]);
          done();
        }));
      }));
    }).catch(done);
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
        const req = requestAsMember(request(app).get('/chat/api/user/conversations'));

        req.query({ unread: true });

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
