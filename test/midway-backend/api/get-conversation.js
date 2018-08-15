'use strict';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('GET /chat/api/conversations/:id', function() {
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

  it('should 404 when conversation does not exist', function(done) {
    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).get(`/chat/api/conversations/${new mongoose.Types.ObjectId()}`));

      req.expect('Content-Type', /json/);
      req.expect(404);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body.error.details).to.match(/No such conversation/);
        done();
      }));
    }));
  });

  it('should 403 when conversation is confidential and current user is not member', function(done) {
    lib.conversation.create({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: []
    }, helpers.callbacks.noErrorAnd(channel => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/conversations/${channel._id}`));

        req.expect('Content-Type', /json/);
        req.expect(403);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.error.details).to.match(/Can not read conversation/);
          done();
        }));
      }));
    }));
  });

  it('should 200 when conversation is confidential and current user is member', function(done) {
    lib.conversation.create({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: [generateMemberFromUser(user)]
    }, helpers.callbacks.noErrorAnd(channel => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/conversations/${channel._id}`));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual({ _id: String(channel._id) });
          done();
        }));
      }));
    }));
  });

  it('should 200 when the conversation is OPEN', function(done) {
    lib.conversation.create({
      type: CONVERSATION_TYPE.OPEN
    }, helpers.callbacks.noErrorAnd(channel => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/conversations/${channel._id}`));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual({ _id: String(channel._id) });
          done();
        }));
      }));
    }));
  });
});
