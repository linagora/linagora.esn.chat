'use strict';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('PUT /chat/api/conversations/:id', function() {
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

  it('should not update the private conversation when user is not member', function(done) {
    lib.conversation.create({
      name: 'foo',
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: []
    }, helpers.callbacks.noErrorAnd(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).put(`/chat/api/conversations/${conversation._id}`));

        req.send({});
        req.expect('Content-Type', /json/);
        req.expect(403);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.error.details).to.match(/Can not update conversation/);
          done();
        }));
      }));
    }));
  });

  it('should update the private conversation when user is member', function(done) {
    lib.conversation.create({
      name: 'foo',
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: [generateMemberFromUser(user)]
    }, helpers.callbacks.noErrorAnd(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).put(`/chat/api/conversations/${conversation._id}`));

        req.send({ name: 'bar' });
        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(() => done()));
      }));
    }));
  });

  it('should update the channel conversation', function(done) {
    lib.conversation.create({
      name: 'foo',
      type: CONVERSATION_TYPE.OPEN
    }, helpers.callbacks.noErrorAnd(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).put(`/chat/api/conversations/${conversation._id}`));

        req.send({ name: 'bar' });
        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(() => done()));
      }));
    }));
  });
});
