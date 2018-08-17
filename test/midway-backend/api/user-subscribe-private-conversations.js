'use strict';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const path = require('path');

describe('PUT /chat/api/user/privateConversations', function() {
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

  it('should create the subscribed conversation document', function(done) {
    const conv1 = new mongoose.Types.ObjectId();
    const conv2 = new mongoose.Types.ObjectId();
    const conversationIds = [conv1, conv2];

    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).put('/chat/api/user/privateConversations'));

      req.send({ conversationIds: conversationIds });
      req.expect('Content-Type', /json/);
      req.expect(200);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body).to.shallowDeepEqual([String(conv1), String(conv2)]);
        done();
      }));
    }));
  });

  it('should update the array of all subscribed private conversations', function(done) {
    const conv1 = new mongoose.Types.ObjectId();
    const conv2 = new mongoose.Types.ObjectId();
    const conversationIds = [conv1, conv2];

    lib.userSubscribedPrivateConversation.store(
      user._id,
      conversationIds
    ).then(() => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).put('/chat/api/user/privateConversations'));

        req.send({ conversationIds: [conv1] });
        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual([String(conv1)]);
          done();
        }));
      }));
    }).catch(done);
  });

  it('should 400 when the conversationIds is not an array', function(done) {
    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).put('/chat/api/user/privateConversations'));

      req.send({ conversationIds: 'notarray' });
      req.expect('Content-Type', /json/);
      req.expect(400);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body).to.shallowDeepEqual({
          error: {
            code: 400,
            message: 'Bad request',
            details: 'You should provide the private conversations ids array'
          }
        });
        done();
      }));
    }));
  });

  it('should 400 when the conversationIds is not objectId convertable', function(done) {
    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).put('/chat/api/user/privateConversations'));

      req.send({ conversationIds: ['notid'] });
      req.expect('Content-Type', /json/);
      req.expect(400);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body).to.shallowDeepEqual({
          error: {
            code: 400,
            message: 'Bad request',
            details: 'You should provide valid ids array'
          }
        });
        done();
      }));
    }));
  });

  it('should 400 when there is no request body', function(done) {
    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).put('/chat/api/user/privateConversations'));

      req.send();
      req.expect('Content-Type', /json/);
      req.expect(400);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body).to.shallowDeepEqual({
          error: {
            code: 400,
            message: 'Bad request',
            details: 'You should provide the private conversations ids array'
          }
        });
        done();
      }));
    }));
  });
});
