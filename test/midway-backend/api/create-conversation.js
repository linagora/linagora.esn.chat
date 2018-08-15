'use strict';

const Q = require('q');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;

describe('POST /chat/api/conversations', function() {
  let helpers, app, lib;
  let user, member;
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
      member = models.users[1];
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

  it('should create a conversation', function(done) {
    const conversation = {
      type: CONVERSATION_TYPE.OPEN,
      mode: CONVERSATION_MODE.CHANNEL,
      name: 'name',
      topic: 'topic',
      purpose: 'purpose'
    };

    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).post('/chat/api/conversations'));

      req.send(conversation);
      req.expect('Content-Type', /json/);
      req.expect(201);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body).to.shallowDeepEqual({
          name: conversation.name,
          type: conversation.type,
          mode: conversation.mode,
          topic: {
            value: conversation.topic,
            creator: String(user._id)
          },
          purpose: {
            value: conversation.purpose,
            creator: String(user._id)
          }
        });
        done();
      }));
    }));
  });

  it('should not create a direct message conversation if the conversation has no member', function(done) {
    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).post('/chat/api/conversations'));

      req.send({
        type: CONVERSATION_TYPE.DIRECT_MESSAGE,
        mode: CONVERSATION_MODE.CHANNEL,
        members: []
      });
      req.expect('Content-Type', /json/);
      req.expect(400);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body).to.deep.equal({
          error: { code: 400, message: 'Bad request', details: 'Can not create a direct message conversation if there is no member' }
        });

        done();
      }));
    }));
  });

  it('should not create a direct message conversation if the conversation has only creator as a member', function(done) {
    const members = [generateMemberFromUser(user)];

    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).post('/chat/api/conversations'));

      req.send({
        type: CONVERSATION_TYPE.DIRECT_MESSAGE,
        mode: CONVERSATION_MODE.CHANNEL,
        members: members.map(member => member.member.id)
      });
      req.expect('Content-Type', /json/);
      req.expect(400);
      req.end(helpers.callbacks.noErrorAnd(res => {
        expect(res.body).to.deep.equal({
          error: { code: 400, message: 'Bad request', details: 'Can not create a direct message conversation with only the creator' }
        });

        done();
      }));
    }));
  });

  it('should not create a new conversation if the conversation has no name and an other with the same participant exist', function(done) {
    const members = [generateMemberFromUser(user)];

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      mode: CONVERSATION_MODE.CHANNEL,
      members: members
    }).then(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post('/chat/api/conversations'));

        req.send({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          mode: CONVERSATION_MODE.CHANNEL,
          members: members.map(member => member.member.id)
        });
        req.expect('Content-Type', /json/);
        req.expect(201);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual({
            _id: String(conversation._id)
          });

          done();
        }));
      }));
    }, done);
  });

  it('should not create a new conversation if the conversation has no name and an other with the same participant exist and has null for name', function(done) {
    const members = [generateMemberFromUser(user)];

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      mode: CONVERSATION_MODE.CHANNEL,
      members: members,
      name: null
    }).then(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post('/chat/api/conversations'));

        req.send({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          mode: CONVERSATION_MODE.CHANNEL,
          members: members.map(member => member.member.id)
        });
        req.expect('Content-Type', /json/);
        req.expect(201);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual({
            _id: String(conversation._id)
          });

          done();
        }));
      }));
    });
  });

  it('should not create a new conversation if the conversation has a name and an other with the same participant exist and has the same name', function(done) {
    const members = [generateMemberFromUser(user)];

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      mode: CONVERSATION_MODE.CHANNEL,
      members: members,
      name: 'name'
    }).then(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post('/chat/api/conversations'));

        req.send({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          mode: CONVERSATION_MODE.CHANNEL,
          members: members.map(member => member.member.id),
          name: 'name'
        });
        req.expect('Content-Type', /json/);
        req.expect(201);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual({
            _id: String(conversation._id)
          });

          done();
        }));
      }));
    });
  });

  it('should create a new conversation if the conversation has a name and an other with the same participant exist but has a different name', function(done) {
    const members = [generateMemberFromUser(user)];

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      mode: CONVERSATION_MODE.CHANNEL,
      members: members,
      name: 'name'
    }).then(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post('/chat/api/conversations'));

        req.send({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          mode: CONVERSATION_MODE.CHANNEL,
          members: members.map(member => member.member.id),
          name: 'name2'
        });
        req.expect('Content-Type', /json/);
        req.expect(201);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body._id).to.not.equal(String(conversation._id));
          done();
        }));
      }));
    });
  });

  it('should create a new conversation if the conversation has no name and an other with the same participant exist but has a name', function(done) {
    const members = [generateMemberFromUser(user)];

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      mode: CONVERSATION_MODE.CHANNEL,
      members: members,
      name: 'name'
    }).then(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post('/chat/api/conversations'));

        req.send({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          mode: CONVERSATION_MODE.CHANNEL,
          members: members.map(member => member.member.id)
        });
        req.expect('Content-Type', /json/);
        req.expect(201);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body._id).to.not.equal(String(conversation._id));
          done();
        }));
      }));
    });
  });

  it('should create a new conversation if the conversation has a name and an other with the same participant exist but has no name', function(done) {
    const members = [generateMemberFromUser(user)];

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      mode: CONVERSATION_MODE.CHANNEL,
      members: members,
      name: null
    }).then(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post('/chat/api/conversations'));

        req.send({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          mode: CONVERSATION_MODE.CHANNEL,
          members: members.map(member => member.member.id),
          name: 'name2'
        });
        req.expect('Content-Type', /json/);
        req.expect(201);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body._id).to.not.equal(String(conversation._id));
          done();
        }));
      }));
    });
  });

  it('should not create the conversation if the conversation has a name and an other with the same participant exist and has the same name', function(done) {
    const members = [generateMemberFromUser(user)];

    Q.denodeify(lib.conversation.create)({
      type: CONVERSATION_TYPE.CONFIDENTIAL,
      mode: CONVERSATION_MODE.CHANNEL,
      members: members,
      name: 'name'
    }).then(conversation => {
      helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        const req = requestAsMember(request(app).post('/chat/api/conversations'));

        req.send({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          mode: CONVERSATION_MODE.CHANNEL,
          members: members.map(member => member.member.id),
          name: 'name'
        });
        req.expect('Content-Type', /json/);
        req.expect(201);
        req.end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual({
            _id: String(conversation._id)
          });
          done();
        }));
      }));
    });
  });

  it('should create and subscribe to the conversation if there is a private conversation', function(done) {
    const members = [generateMemberFromUser(user), generateMemberFromUser(member)];

    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
      const req = requestAsMember(request(app).post('/chat/api/conversations'));

      req.send({
        type: CONVERSATION_TYPE.DIRECT_MESSAGE,
        mode: CONVERSATION_MODE.CHANNEL,
        members: members.map(member => member.member.id)
      });
      req.expect('Content-Type', /json/);
      req.expect(201);
      req.end(helpers.callbacks.noErrorAnd(res => {
        const createdConversationId = String(res.body._id);

        lib.userSubscribedPrivateConversation.get(user.id)
          .then(subscribedPrivateConversation => {
            expect(subscribedPrivateConversation.conversations).to.includes(createdConversationId);
            done();
          });
      }));
    }));
  });
});
