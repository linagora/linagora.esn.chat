'use strict';

const Q = require('q');
const _ = require('lodash');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('GET /chat/api/messages?search=', function() {
  let helpers, app, lib, esIntervalIndex;
  let user;
  const password = 'secret';

  beforeEach(function(done) {
    const self = this;

    helpers = this.helpers;
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

  it('should return messages from public conversations where current user is member', function(done) {
    const search = 'searchme';

    const publicChannel1 = {
      name: 'A public channel',
      type: CONVERSATION_TYPE.OPEN,
      members: [generateMemberFromUser(user)]
    };

    const publicChannel2 = {
      name: 'Another public channel',
      type: CONVERSATION_TYPE.OPEN,
      members: []
    };

    const privateChannel1 = {
      name: 'A private channel I am member of',
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: [generateMemberFromUser(user)]
    };

    const privateChannel2 = {
      name: 'A private channel I am not member of',
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: []
    };

    const message = {
      text: 'This is the message in public channel I am member: searchme',
      type: 'text'
    };

    const message2 = {
      text: 'This is the message in public channel I am not member',
      type: 'text'
    };

    const message3 = {
      text: 'This is the message in private channel I am not member: searchme',
      type: 'text'
    };

    const message4 = {
      text: 'This is the message in private channel I am member but does not contains the search term',
      type: 'text'
    };

    const message5 = {
      text: 'This is the message in public channel I am member but does not contains the search term',
      type: 'text'
    };

    const message6 = {
      text: 'searchme This is the message in private channel I am member and does contain the search term',
      type: 'text'
    };

    Q.spread([
      Q.nfapply(lib.conversation.create, [publicChannel1]),
      Q.nfapply(lib.conversation.create, [publicChannel2]),
      Q.nfapply(lib.conversation.create, [privateChannel1]),
      Q.nfapply(lib.conversation.create, [privateChannel2])
    ], (channel1, channel2, channel3, channel4) => {
      message.channel = channel1._id;
      message2.channel = channel2._id;
      message3.channel = channel4._id;
      message4.channel = channel3._id;
      message5.channel = channel1._id;
      message6.channel = channel3._id;

      return Q.all([
        Q.nfapply(lib.message.create, [message]),
        Q.nfapply(lib.message.create, [message2]),
        Q.nfapply(lib.message.create, [message3]),
        Q.nfapply(lib.message.create, [message4]),
        Q.nfapply(lib.message.create, [message5]),
        Q.nfapply(lib.message.create, [message6])
      ]);
    })
    .then(() => {
      setTimeout(() => {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
          const req = requestAsMember(request(app).get(`/chat/api/messages?search=${search}`));

          req.expect('Content-Type', /json/);
          req.expect(200);
          req.end(helpers.callbacks.noErrorAnd(res => {
            expect(res.headers['x-esn-items-count']).to.equal('2');
            expect(_.find(res.body, { text: message.text, isStarred: false })).to.exist;
            expect(_.find(res.body, { text: message6.text, isStarred: false })).to.exist;
            expect(res.body[0].channel).to.be.an('object');
            expect(res.body[1].channel).to.be.an('object');
            done();
          }));
        }));
      }, esIntervalIndex);
    })
    .catch(done);
  });
});
