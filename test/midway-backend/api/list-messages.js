'use strict';

const request = require('supertest');
const chai = require('chai');
const Q = require('q');
const expect = chai.expect;
const mongoose = require('mongoose');
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('GET /chat/api/conversations/:id/messages', function() {
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
      const req = requestAsMember(request(app).get(`/chat/api/conversations/${new mongoose.Types.ObjectId()}/messages`));

      req.expect('Content-Type', /json/);
      req.expect(404);
      req.end(done);
    }));
  });

  it('should 403 when private conversation and user is not member', function(done) {
    lib.conversation.create({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: []
    }, helpers.callbacks.noErrorAnd(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/conversations/${conversation._id}/messages`));

        req.expect('Content-Type', /json/);
        req.expect(403);
        req.end(done);
      }));
    }));
  });

  it('should 200 with the message list when private conversation and user is member', function(done) {
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
    }).then(() =>
      Q.denodeify(lib.message.create)({
        channel: channelId,
        text: 'Foo bar',
        type: 'text',
        creator: user._id
      })
    ).then(() => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/conversations/${channelId}/messages`));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(2);
          expect(res.body[0].isStarred).to.be.false;
          expect(res.body[1].isStarred).to.be.false;
          done();
        }));
      }));
    }).catch(done);
  });

  it('should 200 with messages', function(done) {
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
    }).then(() =>
      Q.denodeify(lib.message.create)({
        channel: channelId,
        text: 'Foo bar',
        type: 'text',
        creator: user._id
      })
    ).then(() => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/conversations/${channelId}/messages`));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(2);
          expect(res.body[0].isStarred).to.be.false;
          expect(res.body[1].isStarred).to.be.false;
          done();
        }));
      }));
    }).catch(done);
  });

  it('should 200 with messages which are not moderated', function(done) {
    let channelId;

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.OPEN
    }).then(channel => {
      channelId = channel._id;

      return Q.denodeify(lib.message.create)({
        channel: channelId,
        text: 'hello world',
        type: 'text',
        moderate: true,
        creator: user._id
      });
    }).then(() =>
      Q.denodeify(lib.message.create)({
        channel: channelId,
        text: 'hello world',
        type: 'text',
        creator: user._id
      })
    ).then(mongoResult => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/conversations/${channelId}/messages`));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          const expected = JSON.parse(JSON.stringify(mongoResult));

          expected.creator = {
            _id: String(user._id)
          };

          expect(res.body).to.shallowDeepEqual([expected]);
          done();
        }));
      }));
    }).catch(done);
  });

  it('should 200 with messages before the given one', function(done) {
    let channelId;
    let before;
    const date = Date.now();
    const limit = 5;
    const size = 100;

    function createMessages() {

      function create(i) {
        return Q.denodeify(lib.message.create)({
          channel: channelId,
          text: String(i),
          type: 'text',
          timestamps: {
            creation: date + i
          },
          creator: user._id
        }).then(message => {
          if (i === size / 2) {
            before = message;
          }

          return message;
        });
      }

      const promises = [];

      for (let i = 0; i < size; i++) {
        promises.push(create(i));
      }

      return Q.all(promises);
    }

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.OPEN
    }).then(channel => {
      channelId = channel._id;

      return createMessages();
    }).then(() => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/conversations/${channelId}/messages?before=${before._id}&limit=${limit}`));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual([
            {
              text: '45'
            },
            {
              text: '46'
            },
            {
              text: '47'
            },
            {
              text: '48'
            },
            {
              text: '49'
            }
          ]);
          done();
        }));
      }));
    }).catch(done);
  });
});
