'use strict';

const Q = require('q');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('GET /chat/api/messages/:id', function() {
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

  it('should 404 when message does not exist', function(done) {
    const unknownMessageId = new mongoose.Types.ObjectId();

    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).get(`/chat/api/messages/${unknownMessageId}`));

      req.expect('Content-Type', /json/);
      req.expect(404);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body.error.details).to.equal(`Message ${String(unknownMessageId)} not found`);
        done();
      }));
    }));
  });

  it('should 404 when conversation of the message does not exist', function(done) {
    Q.denodeify(lib.message.create)({
      channel: new mongoose.Types.ObjectId(),
      text: 'hello world',
      type: 'text',
      creator: user._id
    }).then(message => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/messages/${message._id}`));

        req.expect('Content-Type', /json/);
        req.expect(404);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.error.details).to.match(/Can not find conversation for message/);
          done();
        }));
      }));
    }).catch(done);
  });

  it('should 403 for private conversation when user is not member', function(done) {
    let channelId;

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: []
    }).then(channel => {
      channelId = channel._id;

      return Q.denodeify(lib.message.create)({
        channel: channelId,
        text: 'hello world',
        type: 'text',
        creator: user._id
      });
    }).then(message => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/messages/${message._id}`));

        req.expect('Content-Type', /json/);
        req.expect(403);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.error.details).to.match(/Can not read conversation/);
          done();
        }));
      }));
    }).catch(done);
  });

  it('should 200 with the message for channel conversation', function(done) {
    let channelId;

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.OPEN
    }).then(channel => {
      channelId = channel._id;

      return Q.denodeify(lib.message.create)({
        channel: channelId,
        text: 'hello world',
        type: 'text',
        creator: user._id
      });
    }).then(mongoResult => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/messages/${mongoResult._id}`));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual(JSON.parse(JSON.stringify(mongoResult)));
          done();
        }));
      }));
    }).catch(done);
  });

  it('should 200 with the message for private conversation when user is member', function(done) {
    let channelId;

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: [generateMemberFromUser(user)]
    }).then(channel => {
      channelId = channel._id;

      return Q.denodeify(lib.message.create)({
        channel: channelId,
        text: 'hello world',
        type: 'text',
        creator: user._id
      });
    }).then(mongoResult => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/messages/${mongoResult._id}`));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual(JSON.parse(JSON.stringify(mongoResult)));
          done();
        }));
      }));
    }).catch(done);
  });
});
