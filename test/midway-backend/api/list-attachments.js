'use strict';

const request = require('supertest');
const chai = require('chai');
const Q = require('q');
const expect = chai.expect;
const mongoose = require('mongoose');
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('GET /chat/api/conversations/:id/attachments', function() {
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
      const req = requestAsMember(request(app).get(`/chat/api/conversations/${new mongoose.Types.ObjectId()}/attachments`));

      req.expect('Content-Type', /json/);
      req.expect(404);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body.error.details).to.match(/No such conversation/);
        done();
      }));
    }));
  });

  it('should 403 when private conversation and user is not member', function(done) {
    lib.conversation.create({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      members: []
    }, helpers.callbacks.noErrorAnd(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/conversations/${conversation._id}/attachments`));

        req.expect('Content-Type', /json/);
        req.expect(403);
        req.end(done);
      }));
    }));
  });

  it('should return empty result when messages does not contain attachments', function(done) {
    let channelId;
    const limit = 10;
    const offset = 0;

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.OPEN
    })
      .then(channel => {
        channelId = channel._id;

        return Q.denodeify(lib.message.create)({
          channel: channelId,
          text: 'hello world',
          type: 'text',
          creator: user._id,
          attachments: []
        });
      })
      .then(() =>
        Q.denodeify(lib.message.create)({
          channel: channelId,
          text: 'Foo bar',
          type: 'text',
          creator: user._id,
          attachments: []
        })
      )
      .then(() => {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
          const req = requestAsMember(request(app).get(`/chat/api/conversations/${channelId}/attachments?limit=${limit}&offset=${offset}`));

          req.expect('Content-Type', /json/);
          req.expect(200);
          req.end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body.length).to.equal(0);
            done();
          }));
        }));
      }).catch(done);
  });

  it('should give the right list of attachment based on limit and offset params', function(done) {

    let channelId;
    const messageSequence = [4, 2, 1, 1, 1, 3, 1, 1];

    function createMessage(numberOfAttachement, index, channelId) {
      const id = '10000000000000000000000' + index;
      const attachements = [];

      for (let i = 0; i < numberOfAttachement; i++) {
        const attachement = {
          _id: index + '0000000000000000000000' + i,
          name: index + '-' + i + '.png',
          contentType: 'image/png',
          length: 5351
        };

        attachements.push(attachement);
      }

      const coreMessage = {
        _id: id,
        channel: channelId,
        text: 'hello world',
        type: 'text',
        creator: String(user._id),
        timestamps: {
          creation: new Date(index).toISOString()
        },
        attachments: attachements
      };

      return coreMessage;
    }

    function createMessagesWithAttachments(messageSequence, channelId) {

      return messageSequence.map((sequence, i) => () => Q.denodeify(lib.message.create)(createMessage(sequence, i + 1, channelId)))
        .reduce(Q.when, Q());
    }

    function getExpectedOutput(generatedMessage) {
      const resReturned = [];

      generatedMessage.attachments.map(function(attachment) {
        return resReturned.push({
          _id: attachment._id,
          message_id: generatedMessage._id,
          creator: {_id: generatedMessage.creator},
          creation_date: generatedMessage.timestamps.creation,
          name: attachment.name,
          contentType: attachment.contentType,
          length: attachment.length
        });
      });

      return resReturned;
    }

    const flatten = list => list.reduce(
      (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
    );

    function getExpectedData(messageSequence, channelId, limit, offset) {
      const expectedResult = [];
      let generatedMessage;
      let expectedObject;

      for (let i = 0; i < messageSequence.length; i++) {
        generatedMessage = createMessage(messageSequence[i], i + 1, channelId);
        expectedObject = getExpectedOutput(generatedMessage);
        expectedResult.push(expectedObject);
      }

      return flatten(expectedResult).slice(offset, limit);
    }

    function init() {

      return Q.denodeify(lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN
      }).then(function(channels) {
        channelId = channels._id;
      });
    }

    function test(limit, offset, limitToExpect, offsetToExpect, channelId) {
      const defer = Q.defer();

      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).get(`/chat/api/conversations/${channelId}/attachments?limit=${limit}&offset=${offset}`));

        req.expect('Content-Type', /json/);
        req.expect(200);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body.length).to.equal(limitToExpect - offsetToExpect);
          expect(res.body).to.shallowDeepEqual(getExpectedData(messageSequence, channelId, limitToExpect, offsetToExpect));
          defer.resolve();
        }));
      }));

      return defer.promise;
    }

    function createMessages() {
      return createMessagesWithAttachments(messageSequence, channelId);
    }

    function firstAPICall() {
      return test(10, 0, 10, 0, channelId);
    }

    function secondAPICall() {
      return test(10, 10, 14, 10, channelId);
    }

    init()
      .then(createMessages)
      .then(firstAPICall)
      .then(secondAPICall)
      .then(done)
      .catch(done);
    });

  it('should 200 with messages which are not moderated', function(done) {
    let channelId;
    const limit = 10;
    const offset = 0;

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.OPEN
    })
      .then(channel => {
        channelId = channel._id;

        return Q.denodeify(lib.message.create)({
          _id: '000000000000000000000012',
          channel: channelId,
          text: 'hello world',
          type: 'text',
          moderate: true,
          creator: '5873a63e614c5d28384eb9b5',
          attachments: [{
            _id: '586d36d1587c5f0f56f4c13c',
            name: 'indicatorDesktop.png',
            contentType: 'image/png',
            length: 5351
          }]
        });
      })
      .then(() =>
        Q.denodeify(lib.message.create)({
          _id: '000000000000000000000010',
          channel: channelId,
          text: 'hello world',
          type: 'text',
          creator: '5873a63e614c5d28384eb9b5',
          attachments: [{
            _id: '586d36d1587c5f0f56f4c13c',
            name: 'indicatorDesktop.png',
            contentType: 'image/png',
            length: 5351
          }]
        })
      )
      .then(() => {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
          const req = requestAsMember(request(app).get(`/chat/api/conversations/${channelId}/attachments?limit=${limit}&offset=${offset}`));

          req.expect('Content-Type', /json/);
          req.expect(200);
          req.end(helpers.callbacks.noErrorAnd(() => {
            done();
          }));
        }));
    })
    .catch(done);
  });
});
