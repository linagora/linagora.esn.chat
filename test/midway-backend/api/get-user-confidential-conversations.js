'use strict';

const Q = require('q');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;

describe('GET /chat/api/user/conversations/private', function() {
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

  it('should return all confidential conversations with me inside which are not moderated', function(done) {
    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      mode: CONVERSATION_MODE.CHANNEL,
      members: []
    }).then(() =>
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        moderate: true,
        members: [generateMemberFromUser(user)]
      })
    ).then(() =>
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        members: [generateMemberFromUser(user)]
      })
    ).then(channel => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get('/chat/api/user/conversations/private'));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(1);
          expect(res.body).to.shallowDeepEqual([{_id: String(channel._id)}]);
          done();
        }));
      }));
    }).catch(done);
  });
});
