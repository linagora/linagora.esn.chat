'use strict';

const Q = require('q');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;

describe('GET /chat/api/user/privateConversations', function() {
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

  it('should return an empty array when the subscribed conversation document does not exist', function(done) {
    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).get('/chat/api/user/privateConversations'));

      req.expect('Content-Type', /json/);
      req.expect(200);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body).to.shallowDeepEqual([]);
        done();
      }));
    }));
  });

  it('should return the array of all subscribed private conversations', function(done) {
    Q.all([
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.DIRECT_MESSAGE,
        mode: CONVERSATION_MODE.CHANNEL,
        moderate: true
      }),
      Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.DIRECT_MESSAGE,
        mode: CONVERSATION_MODE.CHANNEL,
        moderate: true
      })
    ])
    .spread(executeTest).catch(done);

    function executeTest(conversation1, conversation2) {
      lib.userSubscribedPrivateConversation.store(
        user._id,
        [conversation1._id, conversation2._id]
      ).then(() => {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
          const req = requestAsMember(request(app).get('/chat/api/user/privateConversations'));

          req.expect('Content-Type', /json/);
          req.expect(200);
          req.end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual([
              JSON.parse(JSON.stringify(conversation1)),
              JSON.parse(JSON.stringify(conversation2))
            ]);
            done();
          }));
        }));
      }).catch(done);
    }
  });
});
