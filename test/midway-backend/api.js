'use strict';

var request = require('supertest');
var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var Q = require('q');
var redis = require('redis');
var async = require('async');
var pubsub = require('linagora-rse/backend/core/pubsub');
var CONSTANTS = require('../../backend/lib/constants');
var CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('The chat API', function() {

  var deps, mongoose, userId, user, app, redisClient;

  function dependencies(name) {
    return deps[name];
  }

  var jsonnify = _.flow(JSON.stringify, JSON.parse);

  beforeEach(function(done) {
    mongoose = require('mongoose');
    mongoose.connect(this.testEnv.mongoUrl);
    userId = mongoose.Types.ObjectId();
    redisClient = redis.createClient(this.testEnv.redisPort);

    deps = {
      logger: require('../fixtures/logger'),
      pubsub: pubsub,
      db: {
        mongo: {
          mongoose: mongoose
        },
        redis: {
          getClient: function(callback) {
            callback(null, redisClient);
          }
        },
      },
      authorizationMW: {
        requiresAPILogin: function(req, res, next) {
          req.user = {
            _id: userId
          };
          next();
        }
      },
    };

    app = this.helpers.loadApplication(dependencies);
    var UserSchema = mongoose.model('User');

    user = new UserSchema({
      _id: userId,
      firstname: 'Eric',
      username: 'eric.cartman',
      lastname: 'Cartman'
    });

    user.save(done);
  });

  afterEach(function(done) {
    async.parallel([this.helpers.mongo.dropDatabase, this.helpers.resetRedis], done);
  });

  describe('GET /api/channels', function() {
    it('should return an array of channels', function(done) {
      function execTest(err, channel) {
        err && done(err);
        request(app.express)
          .get('/api/channels')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body).to.deep.equal([jsonnify(channel)]);
            done();
          });
      }

      app.lib.conversation.createConversation({
        type: CONVERSATION_TYPE.CHANNEL
      }, execTest);

    });
  });

  describe('GET /api/conversations/:id', function() {
    it('should the given conversation', function(done) {
      app.lib.conversation.createConversation({
        type: CONVERSATION_TYPE.CHANNEL
      }, function(err, channel) {
        err && done(err);
        request(app.express)
          .get('/api/conversations/' + channel._id)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal(jsonnify(channel));
            done();
          });
      });

    });
  });

  describe('GET /api/:channel/messages', function() {
    it('should return an array of messages from a conversation', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.CHANNEL
      }).then(function(channels) {
        channelId = channels._id;
        return Q.denodeify(app.lib.conversation.createMessage)({
          channel: channelId,
          text: 'hello world',
          type: 'text',
          creator: userId
        });
      }).then(function(mongoResult) {
        request(app.express)
          .get('/api/' + channelId + '/messages')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            var expected = JSON.parse(JSON.stringify(mongoResult));
            expected.creator = {
              username: user.username,
              _id: user._id + '',
              __v: 0
            };
            expect(res.body).to.deep.equal([expected]);
            done();
          });
      }).catch(done);
    });
  });

  describe('GET /api/messages/:id', function() {
    it('should return the message', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.CHANNEL
      }).then(function(channels) {
        channelId = channels._id;
        return Q.denodeify(app.lib.conversation.createMessage)({
          channel: channelId,
          text: 'hello world',
          type: 'text',
          creator: userId
        });
      }).then(function(mongoResult) {
        request(app.express)
          .get('/api/messages/' + mongoResult._id)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal(JSON.parse(JSON.stringify(mongoResult)));
            done();
          });
      }).catch(done);
    });
  });

  describe('POST /api/conversations', function(done) {
    it('should create a conversation and return it\' json', function(done) {
      request(app.express)
        .post('/api/conversations')
        .type('json')
        .send({
          type: CONVERSATION_TYPE.CHANNEL,
          name: 'name',
          topic: 'topic',
          purpose: 'purpose'
        })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          expect(res.body).to.shallowDeepEqual({
            name: 'name',
            type: CONVERSATION_TYPE.CHANNEL,
            creator: userId.toString(),
            topic: {
              value: 'topic',
              creator: userId.toString(),
            },
            members: {
              0: {_id: userId.toString()},
              length: 1
            },
            purpose: {
              value: 'purpose', creator: userId.toString()
            }
          });
          done();
        });
    });

    it('should fail with a 403 if it is a community conversation', function() {
      request(app.express)
        .post('/api/conversations')
        .type('json')
        .send({
          type: CONVERSATION_TYPE.COMMUNITY,
          name: 'name',
          topic: 'topic',
          purpose: 'purpose'
        })
        .expect(403);
    });
  });

  describe('PUT /api/conversations/:id/members', function() {
    it('should add the user in members of the conversation', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.CHANNEL
      }).then(function(mongoResponse) {
        channelId = mongoResponse._id;
        return Q.denodeify(function(callback) {
          request(app.express)
            .put('/api/conversations/' + channelId + '/members')
            .expect(204)
            .end(callback);
        })();
      }).then(function(res) {
        return Q.denodeify(app.lib.conversation.getConversation)(channelId);
      }).then(function(channel) {
        expect(channel.members).to.shallowDeepEqual({
          0: {_id: userId},
          length: 1
        });
        done();
      }).catch(done);
    });
  });

  describe('DELETE /api/conversations/:id/members', function() {

    it('it should delete the user in members of the conversation', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.CHANNEL,
        members: [userId]
      }).then(function(mongoResponse) {
        channelId = mongoResponse._id;
        return Q.denodeify(function(callback) {
          request(app.express)
            .delete('/api/conversations/' + channelId + '/members')
            .expect(204)
            .end(callback);
        })();
      }).then(function(res) {
        return Q.denodeify(app.lib.conversation.getConversation)(channelId);
      }).then(function(channel) {
        expect(channel.members.length).to.deep.equal(0);
        done();
      }).catch(done);

    });
  });

  describe('GET /api/community', function() {
    it('should return community conversations with given participants parameters', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      var channel;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.COMMUNITY,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        channel = mongoResponse;
        request(app.express)
          .get('/api/community?members=' + otherMember1.toString() + '&members=' + otherMember2.toString())
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal([jsonnify(channel)]);
            done();
          });
      }).catch(done);
    });

    it('should return community conversations with the given id is provided', function(done) {
      var channel;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.COMMUNITY,
        members: [userId]
      }).then(function(mongoResponse) {
        channel = mongoResponse;
        request(app.express)
          .get('/api/community?id=' + channel._id)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal(jsonnify(channel));
            done();
          });
      }).catch(done);
    });

    it('should fail if no id neither members attribute are provided', function() {
      request(app.express)
        .get('/api/community')
        .expect(400);
    });

    it('should fail if both members and id attibute are provided', function() {
      request(app.express)
        .get('/api/community?members=babla&id=id')
        .expect(400);
    });

    it('should return 404 if user try to obtain a community where he is not present', function(done) {
      var channel;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.COMMUNITY,
        members: []
      }).then(function(mongoResponse) {
        channel = mongoResponse;
        request(app.express)
          .get('/api/community?id=' + channel._id)
          .expect(404, done);
      }).catch(done);
    });

    it('not return community conversations with more than given participants parameters', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.COMMUNITY,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/community?members=' + otherMember1.toString())
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal([]);
            done();
          });
      }).catch(done);
    });

    it('it fail with 400 if no participant', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.COMMUNITY,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/community')
          .expect(400, done);
      }).catch(done);
    });

    it('should not return community conversations without the current user', function(done) {
      var otherMember = new mongoose.Types.ObjectId();

      var channel;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.COMMUNITY,
        members: [otherMember]
      }).then(function(mongoResponse) {
        channel = mongoResponse[0];
        request(app.express)
          .get('/api/community?members=' + otherMember.toString())
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal([]);
            done();
          });
      }).catch(done);
    });
  });

  describe('GET /api/conversations/private', function() {
    it('should return private conversations with given participants parameters', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      var channel;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        channel = mongoResponse;
        request(app.express)
          .get('/api/private?members=' + otherMember1.toString() + '&members=' + otherMember2.toString())
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal([jsonnify(channel)]);
            done();
          });
      }).catch(done);
    });

    it('not return private conversations with more than given participants parameters', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/private?members=' + otherMember1.toString())
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal([]);
            done();
          });
      }).catch(done);
    });

    it('it fail with 400 if no participant', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/private')
          .expect(400, done);
      }).catch(done);
    });

    it('should not return private conversations without the current user', function(done) {
      var otherMember = new mongoose.Types.ObjectId();

      var channel;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [otherMember]
      }).then(function(mongoResponse) {
        channel = mongoResponse[0];
        request(app.express)
          .get('/api/private?members=' + otherMember.toString())
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal([]);
            done();
          });
      }).catch(done);
    });
  });

  describe('GET /api/me/private', function() {
    it('should return all private conversations with me inside', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      var channel;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        return Q.denodeify(app.lib.conversation.createConversation)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2]
        }).then(function(mongoResponse) {
          channel = mongoResponse;
          request(app.express)
            .get('/api/me/private')
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err);
              }
              expect(res.body).to.deep.equal([jsonnify(channel)]);
              done();
            });
        }).catch(done);
      });
    });
  });

  describe('GET /api/me/conversation', function() {
    it('should return all conversation with me inside', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      var channel1, channel2;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.COMMUNITY,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        channel1 = mongoResponse;
        return Q.denodeify(app.lib.conversation.createConversation)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2]
        });
      }).then(function(mongoResponse) {
        channel2 = mongoResponse;
        return Q.denodeify(app.lib.conversation.createConversation)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [otherMember1, otherMember2]
        });
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/me/conversation')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal(jsonnify([channel1, channel2]));
            done();
          });
      }).catch(done);
    });

    it('should return channel even if I am not a member of them yet', function(done) {
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.CHANNEL,
        members: []
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/me/conversation')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal(jsonnify([mongoResponse]));
            done();
          });
      }).catch(done);
    });

    it('should put conversation with the most recent last message first', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      var channel1, channel2;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.COMMUNITY,
        members: [userId, otherMember1, otherMember2],
        last_message: {date: new Date(1469605336000)}
      }).then(function(mongoResponse) {
        channel1 = mongoResponse;
        return Q.denodeify(app.lib.conversation.createConversation)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2],
          last_message: {date: new Date(1469605337000)}
        });
      }).then(function(mongoResponse) {
        channel2 = mongoResponse;
        request(app.express)
          .get('/api/me/conversation')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal(jsonnify([channel2, channel1]));
            done();
          });
      }).catch(done);
    });

    it('should return only conversation of this type if type provided ', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      var channel1, channel2;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.COMMUNITY,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        channel1 = mongoResponse;
        return Q.denodeify(app.lib.conversation.createConversation)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2]
        });
      }).then(function(mongoResponse) {
        channel2 = mongoResponse;
        return Q.denodeify(app.lib.conversation.createConversation)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [otherMember1, otherMember2]
        });
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/me/conversation?type=private')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal(jsonnify([channel2]));
            done();
          });
      }).catch(done);
    });

    it('should return only conversation of one of the given type if more than one type is given', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      var channel1, channel2;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.CHANNEL,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        channel1 = mongoResponse;
        return Q.denodeify(app.lib.conversation.createConversation)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2]
        });
      }).then(function(mongoResponse) {
        channel2 = mongoResponse;
        return Q.denodeify(app.lib.conversation.createConversation)({
          type: CONVERSATION_TYPE.COMMUNITY,
          members: [userId, otherMember1, otherMember2]
        });
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/me/conversation?type=private&type=channel')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal(jsonnify([channel1, channel2]));
            done();
          });
      }).catch(done);
    });
  });

  describe('GET /api/me/community', function() {
    it('should return all community conversations with me inside', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      var channel;
      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.COMMUNITY,
        members: [otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        return Q.denodeify(app.lib.conversation.createConversation)({
          type: CONVERSATION_TYPE.COMMUNITY,
          members: [userId, otherMember1, otherMember2]
        }).then(function(mongoResponse) {
          channel = mongoResponse;
          request(app.express)
            .get('/api/me/community')
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err);
              }
              expect(res.body).to.deep.equal([jsonnify(channel)]);
              done();
            });
        }).catch(done);
      });
    });
  });

  describe('DELETE /api/conversation', function() {
    it('should delete a conversation', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.createConversation)({
        type: CONVERSATION_TYPE.CHANNEL
      }).then(function(mongoResponse) {
        channelId = mongoResponse._id;
        return Q.denodeify(function(callback) {
          request(app.express)
            .delete('/api/conversations/' + channelId)
            .expect(200)
            .end(callback);
        })();
      }).then(function(res) {
        return Q.denodeify(app.lib.conversation.getConversation)(channelId);
      }).then(function(channel) {
        expect(channel).to.be.null;
        done();
      }).catch(done);
    });
  });

  describe('GET /api/state', function() {
    it('should return disconnect for user which state is unknow', function(done) {
      request(app.express)
        .get('/api/state/unknowId')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.equals({state: 'disconnected'});
          done();
        });
    });

    it('should return state of requested user state wich is known', function(done) {
      app.lib.userState.set('user', 'state').then(function() {
        request(app.express)
          .get('/api/state/user')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equals({state: 'state'});
            done();
          });
      });
    });
  });
});
