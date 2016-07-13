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
var CHANNEL_TYPE = CONSTANTS.CHANNEL_TYPE;

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

      app.lib.channel.createChannel({
        type: CHANNEL_TYPE.CHANNEL
      }, execTest);

    });
  });

  describe('GET /api/channels/:id', function() {
    it('should the given channel', function(done) {
      app.lib.channel.createChannel({
        type: CHANNEL_TYPE.CHANNEL
      }, function(err, channel) {
        err && done(err);
        request(app.express)
          .get('/api/channels/' + channel._id)
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
    it('should return an array of messages from a channel', function(done) {
      var channelId;

      Q.denodeify(app.lib.channel.createChannel)({
        type: CHANNEL_TYPE.CHANNEL
      }).then(function(channels) {
        channelId = channels._id;
        return Q.denodeify(app.lib.channel.createMessage)({
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

  describe('POST /api/channels', function(done) {
    it('should create a Channel and return it\' json', function(done) {
      request(app.express)
        .post('/api/channels')
        .type('json')
        .send({
          type: CHANNEL_TYPE.CHANNEL,
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
            type: CHANNEL_TYPE.CHANNEL,
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
  });

  describe('PUT /api/channels/:id/members', function() {
    it('it should add the user in members group', function(done) {
      var channelId;

      Q.denodeify(app.lib.channel.createChannel)({
        type: CHANNEL_TYPE.CHANNEL
      }).then(function(mongoResponse) {
        channelId = mongoResponse._id;
        return Q.denodeify(function(callback) {
          request(app.express)
            .put('/api/channels/' + channelId + '/members')
            .expect(204)
            .end(callback);
        })();
      }).then(function(res) {
        return Q.denodeify(app.lib.channel.getChannel)(channelId);
      }).then(function(channel) {
        expect(channel.members).to.shallowDeepEqual({
          0: {_id: userId},
          length: 1
        });
        done();
      }).catch(done);
    });
  });

  describe('DELETE /api/channels/:id/members', function() {

    it('it should delete the user in members group', function(done) {
      var channelId;

      Q.denodeify(app.lib.channel.createChannel)({
        type: CHANNEL_TYPE.CHANNEL,
        members: [userId]
      }).then(function(mongoResponse) {
        channelId = mongoResponse._id;
        return Q.denodeify(function(callback) {
          request(app.express)
            .delete('/api/channels/' + channelId + '/members')
            .expect(204)
            .end(callback);
        })();
      }).then(function(res) {
        return Q.denodeify(app.lib.channel.getChannel)(channelId);
      }).then(function(channel) {
        expect(channel.members.length).to.deep.equal(0);
        done();
      }).catch(done);

    });
  });

  describe('GET /api/channels/groups', function() {
    it('it should return groups with given participants parameters', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      var channel;
      Q.denodeify(app.lib.channel.createChannel)({
        type: CHANNEL_TYPE.GROUP,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        channel = mongoResponse;
        request(app.express)
          .get('/api/groups?members=' + otherMember1.toString() + '&members=' + otherMember2.toString())
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

    it('it not return groups with more than given participants parameters', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      Q.denodeify(app.lib.channel.createChannel)({
        type: CHANNEL_TYPE.GROUP,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/groups?members=' + otherMember1.toString())
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

      Q.denodeify(app.lib.channel.createChannel)({
        type: CHANNEL_TYPE.GROUP,
        members: [userId, otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/groups')
          .expect(400, done);
      }).catch(done);
    });

    it('it should not return groups without the current user', function(done) {
      var otherMember = new mongoose.Types.ObjectId();

      var channel;
      Q.denodeify(app.lib.channel.createChannel)({
        type: CHANNEL_TYPE.GROUP,
        members: [otherMember]
      }).then(function(mongoResponse) {
        channel = mongoResponse[0];
        request(app.express)
          .get('/api/groups?members=' + otherMember.toString())
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

  describe('GET /api/me/groups', function() {
    it('it should return all groups with me inside', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();

      var channel;
      Q.denodeify(app.lib.channel.createChannel)({
        type: CHANNEL_TYPE.GROUP,
        members: [otherMember1, otherMember2]
      }).then(function(mongoResponse) {
        return Q.denodeify(app.lib.channel.createChannel)({
          type: CHANNEL_TYPE.GROUP,
          members: [userId, otherMember1, otherMember2]
        }).then(function(mongoResponse) {
          channel = mongoResponse;
          request(app.express)
            .get('/api/me/groups')
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

  describe('DELETE /api/channels', function() {
    it('should delete a channel', function(done) {
      var channelId;

      Q.denodeify(app.lib.channel.createChannel)({
        type: CHANNEL_TYPE.CHANNEL
      }).then(function(mongoResponse) {
        channelId = mongoResponse._id;
        return Q.denodeify(function(callback) {
          request(app.express)
            .delete('/api/channels/' + channelId)
            .expect(200)
            .end(callback);
        })();
      }).then(function(res) {
        return Q.denodeify(app.lib.channel.getChannel)(channelId);
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
