'use strict';

const Q = require('q');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('GET /chat/api/conversations?search=', function() {
  let helpers, app, lib, esIntervalIndex;
  let user;
  const password = 'secret';

  beforeEach(function(done) {
    const self = this;

    helpers = self.helpers;
    lib = self.helpers.modules.current.lib.lib;
    app = self.helpers.modules.current.app;
    esIntervalIndex = self.testEnv.serversConfig.elasticsearch.interval_index;

    const deployOptions = {
      fixtures: path.normalize(`${__dirname}/../fixtures/deployments`)
    };

    helpers.api.applyDomainDeployment('chatModule', deployOptions, helpers.callbacks.noErrorAnd(models => {
      user = models.users[0];
      done();
    }));
  });

  const generateMemberFromUser = user => ({
    member: {
      id: String(user._id || user),
      objectType: 'user'
    }
  });

  it('should return all public conversations even channels which user is not a member of', function(done) {
    const search = 'searchme';
    const publicChannel1 = {
      name: 'First public channel: searchme',
      type: CONVERSATION_TYPE.OPEN,
      members: [generateMemberFromUser(user)]
    };

    const publicChannel2 = {
      name: 'Second public channel',
      topic: {
        value: 'This channel topic is relevant: searchme'
      },
      type: CONVERSATION_TYPE.OPEN,
      members: []
    };

    const publicChannel3 = {
      name: 'Third public channel',
      purpose: {
        value: 'This channel purpose is relevant: searchme'
      },
      type: CONVERSATION_TYPE.OPEN,
      members: [generateMemberFromUser(user)]
    };

    const privateChannel1 = {
      name: 'A private channel: searchme',
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: [generateMemberFromUser(user)]
    };

    const privateChannel2 = {
      name: 'This private channel does not belong to current user: searchme',
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: []
    };

    Q.all([
      Q.nfapply(lib.conversation.create, [publicChannel1]),
      Q.nfapply(lib.conversation.create, [publicChannel2]),
      Q.nfapply(lib.conversation.create, [publicChannel3]),
      Q.nfapply(lib.conversation.create, [privateChannel1]),
      Q.nfapply(lib.conversation.create, [privateChannel2])
    ])
    .then(() => {
      setTimeout(() => {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
          const req = requestAsMember(request(app).get(`/chat/api/conversations?search=${search}`));

          req.expect('Content-Type', /json/);
          req.expect(200);
          req.end(helpers.callbacks.noErrorAnd(res => {
            const results = res.body.map(result => result.name);

            expect(res.headers['x-esn-items-count']).to.equal('4');
            expect(results).to.include(publicChannel1.name);
            expect(results).to.include(publicChannel2.name);
            expect(results).to.include(publicChannel3.name);
            expect(results).to.include(privateChannel1.name);
            expect(results).to.not.include(privateChannel2.name);
            done();
          }));
        }));
      }, esIntervalIndex);
    })
    .catch(done);
  });
});
