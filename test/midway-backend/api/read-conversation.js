'use strict';

const Q = require('q');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('POST /chat/api/conversations/:id/readed', function() {
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

  it('should 404 when conversation is not found', function(done) {
    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).post(`/chat/api/conversations/${new mongoose.Types.ObjectId()}/readed`));

      req.expect('Content-Type', /json/);
      req.expect(404);
      req.end(done);
    }));
  });

  it('should 403 when conversation is private and user is not member', function(done) {
    lib.conversation.create({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: [],
      numOfMessage: 42
    }, helpers.callbacks.noErrorAnd(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post(`/chat/api/conversations/${conversation._id}/readed`));

        req.expect('Content-Type', /json/);
        req.expect(403);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.error.details).to.match(/Can not update conversation/);
          done();
        }));
      }));
    }));
  });

  it('should 204 when conversation is private and user is member', function(done) {
    const numOfMessage = 42;

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: [generateMemberFromUser(user)],
      numOfMessage
    })
    .then(conversation => {
      const channelId = conversation._id;

      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post(`/chat/api/conversations/${channelId}/readed`));

        req.expect(204);
        req.end(helpers.callbacks.noErrorAnd(() => {
          Q.denodeify(lib.conversation.getById)(channelId)
            .then(channel => {
              const expected = {
                [String(user._id)]: {
                  numOfReadMessages: numOfMessage,
                  numOfUnseenMentions: 0
                }
              };

              expect(channel.memberStates).to.deep.equal(expected);
              done();
            });
        }));
      }));
    })
    .catch(done);
  });

  it('should 204 when conversation is channel', function(done) {
    const numOfMessage = 42;

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.OPEN,
      members: [generateMemberFromUser(user)],
      numOfMessage
    })
    .then(conversation => {
      const channelId = conversation._id;

      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post(`/chat/api/conversations/${channelId}/readed`));

        req.expect(204);
        req.end(helpers.callbacks.noErrorAnd(() => {
          Q.denodeify(lib.conversation.getById)(channelId)
            .then(channel => {
              const expected = {
                [String(user._id)]: {
                  numOfReadMessages: numOfMessage,
                  numOfUnseenMentions: 0
                }
              };

              expect(channel.memberStates).to.deep.equal(expected);
              done();
            });
        }));
      }));
    })
    .catch(done);
  });
});
