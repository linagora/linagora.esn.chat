'use strict';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('POST /chat/api/conversations/:id/archive', function() {
  let helpers, app, lib;
  let domain, domainAdministrator, user;
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
      domainAdministrator = models.users[0];
      user = models.users[1];
      domain = models.domain;

      done();
    }));
  });

  const generateMemberFromUser = user => ({
    member: {
      id: String(user._id || user),
      objectType: 'user'
    }
  });

  it('should 403 when conversation is not a public channel', function(done) {
    lib.conversation.create({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: [generateMemberFromUser(user)],
      numOfMessage: 1
    }, helpers.callbacks.noErrorAnd(conversation => {
      helpers.api.loginAsUser(app, domainAdministrator.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post(`/chat/api/conversations/${conversation._id}/archive`));

        req.expect('Content-Type', /json/);
        req.expect(403);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.error.details).to.match(/Can not archive a conversation which is not an open channel/);
          done();
        }));
      }));
    }));
  });

  it('should 403 when user is not a domain administrator nor a channel creator', function(done) {
    const options = {
      type: CONVERSATION_TYPE.OPEN,
      domain_id: [domain._id],
      creator: domainAdministrator._id
    };

    lib.conversation
      .create(options, helpers.callbacks.noErrorAnd(conversation => {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
          const req = requestAsMember(request(app).post(`/chat/api/conversations/${conversation._id}/archive`));

          req.expect('Content-Type', /json/);
          req.expect(403);
          req.end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body.error.details).to.match(/You can not archive a conversation/);
            done();
          }));
        }));
      }));
  });

  it('should 200 when user is manager of the conversation', function(done) {
    const options = {
      type: CONVERSATION_TYPE.OPEN,
      domain_id: [domain._id],
      creator: user._id
    };

    lib.conversation
      .create(options, helpers.callbacks.noErrorAnd(conversation => {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
          const req = requestAsMember(request(app).post(`/chat/api/conversations/${conversation._id}/archive`));

          req.expect('Content-Type', /json/);
          req.expect(200);
          req.end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({ archived: true });
            done();
          }));
        }));
      }));
  });
});
