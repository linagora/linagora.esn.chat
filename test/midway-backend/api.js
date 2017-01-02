'use strict';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const Q = require('q');
const redis = require('redis');
const async = require('async');
const pubsub = require('linagora-rse/backend/core/pubsub');
const CONSTANTS = require('../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('The chat API', function() {

  var deps, mongoose, userId, user, anotherUserId, anotherUser, app, redisClient, collaborations, collaboration, writable;

  function dependencies(name) {
    return deps[name];
  }

  var jsonnify = _.flow(JSON.stringify, JSON.parse);

  beforeEach(function(done) {
    mongoose = require('mongoose');
    mongoose.Promise = Q.Promise;
    mongoose.connect(this.testEnv.mongoUrl);
    userId = mongoose.Types.ObjectId();
    anotherUserId = mongoose.Types.ObjectId();
    redisClient = redis.createClient(this.testEnv.redisPort);
    collaborations = [];
    collaboration = {};
    writable = true;

    deps = {
      logger: require('../fixtures/logger'),
      user: {
        moderation: {registerHandler: _.constant()},
        get: function(id, callback) {
          mongoose.model('User').findOne({_id: id}, callback);
        }
      },
      collaboration: {
        getCollaborationsForUser: function(user, options, callback) {
          callback(null, collaborations);
        },
        queryOne: function(tuple, query, callback) {
          callback(null, collaboration);
        },
        permission: {
          canWrite: function(collaboration, tuple, callback) {
            callback(null, writable);
          }
        }
      },
      elasticsearch: {
        listeners: {
          addListener: function() {}
        }
      },
      pubsub: pubsub,
      db: {
        mongo: {
          mongoose: mongoose
        },
        redis: {
          getClient: function(callback) {
            callback(null, redisClient);
          }
        }
      },
      authorizationMW: {
        requiresAPILogin: function(req, res, next) {
          req.user = {
            _id: userId
          };
          next();
        }
      },
      denormalizeUser: {
        denormalize: function(member) {
          return Q.when(member);
        }
      }
    };

    app = this.helpers.loadApplication(dependencies);
    var UserSchema = mongoose.model('User');

    user = new UserSchema({
      _id: userId,
      firstname: 'Eric',
      username: 'eric.cartman',
      lastname: 'Cartman'
    });

    anotherUser = new UserSchema({
      _id: anotherUserId,
      firstname: 'Chuck',
      username: 'Chuck Norris',
      lastname: 'Norris'
    });

    Q.all([user.save(), anotherUser.save()]).then(() => {
      done();
    }, done);
  });

  afterEach(function(done) {
    async.parallel([this.helpers.mongo.dropDatabase, this.helpers.resetRedis], done);
  });

  describe('GET /api/channels', function() {
    it('should return an array of non moderate channels', function(done) {
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

      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CHANNEL,
        moderate: true
      }, function(err) {
        err && done(err);
        app.lib.conversation.create({
          type: CONVERSATION_TYPE.CHANNEL
        }, execTest);
      });

    });
  });

  describe('GET /api/conversations/:id', function() {
    it('should 404 when conversation does not exist', function(done) {
      request(app.express)
        .get('/api/conversations/' + new mongoose.Types.ObjectId())
        .expect('Content-Type', /json/)
        .expect(404)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body.error.details).to.match(/No such conversation/);
          done();
        });
    });

    it('should 403 when conversation is private and current user is not member', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
      }, function(err, channel) {
        err && done(err);
        request(app.express)
          .get('/api/conversations/' + channel._id)
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not read conversation/);
            done();
          });
      });
    });

    it('should 200 when conversation is private and current user is member', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [new mongoose.Types.ObjectId(), userId]
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

    it('should 403 when conversation is collaboration', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.COLLABORATION
      }, function(err, channel) {
        err && done(err);
        request(app.express)
          .get('/api/conversations/' + channel._id)
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not read conversation/);
            done();
          });
      });
    });

    it('should 200 when the conversation is a channel', function(done) {
      app.lib.conversation.create({
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

  describe('PUT /api/conversations/:id', function() {

    it('should 403 when conversation is collaboration', function(done) {
      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.COLLABORATION
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + conversation._id)
          .send({})
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not update conversation/);
            done();
          });
      });
    });

    it('should not update the private conversation when user is not member', function(done) {
      const name = 'bar';

      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.PRIVATE,
        members: []
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + conversation._id)
          .send({name})
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not update conversation/);
            done();
          });
      });
    });

    it('should update the private conversation when user is member', function(done) {
      const name = 'bar';

      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId]
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + conversation._id)
          .send({name})
          .expect(200)
          .end(function(err) {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    it('should update the channel conversation', function(done) {
      const name = 'bar';

      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.CHANNEL
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + conversation._id)
          .send({name})
          .expect(200)
          .end(function(err) {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });
  });

  describe('PUT /api/conversations/:id/topic', function() {

    it('should 403 when conversation is collaboration', function(done) {
      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.COLLABORATION
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + conversation._id + '/topic')
          .send({value: 'My Topic'})
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not update conversation/);
            done();
          });
      });
    });

    it('should not update the private conversation when user is not member', function(done) {
      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.PRIVATE,
        members: []
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + conversation._id + '/topic')
          .send({value: 'My Topic'})
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not update conversation/);
            done();
          });
      });
    });

    it('should update the private conversation when user is member', function(done) {
      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId]
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + conversation._id + '/topic')
          .send({value: 'My Topic'})
          .expect(200)
          .end(function(err) {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    it('should update the channel conversation', function(done) {
      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.CHANNEL
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + conversation._id + '/topic')
          .send({value: 'My Topic'})
          .expect(200)
          .end(function(err) {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });
  });

  describe('GET /api/conversations/:id/messages', function() {

    it('should 404 when conversation does not exist', function(done) {
      request(app.express)
        .get('/api/conversations/' + new mongoose.Types.ObjectId() + '/messages')
        .expect('Content-Type', /json/)
        .expect(404)
        .end(done);
    });

    it('should 403 when private conversation and user is not member', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [new mongoose.Types.ObjectId()]
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .get('/api/conversations/' + conversation._id + '/messages')
          .expect('Content-Type', /json/)
          .expect(403)
          .end(done);
        });
    });

    it('should 200 with the message list when private conversation and user is member', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId]
      }).then(function(channels) {
        channelId = channels._id;

        return Q.denodeify(app.lib.message.create)({
          channel: channelId,
          text: 'hello world',
          type: 'text',
          creator: userId
        });
      }).then(function() {
        return Q.denodeify(app.lib.message.create)({
          channel: channelId,
          text: 'Foo bar',
          type: 'text',
          creator: userId
        });
      }).then(function() {
        request(app.express)
          .get('/api/conversations/' + channelId + '/messages')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.length).to.equal(2);
            done();
          });
      }).catch(done);
    });

    it('should 403 when collaboration conversation', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.COLLABORATION
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .get('/api/conversations/' + conversation._id + '/messages')
          .expect('Content-Type', /json/)
          .expect(403)
          .end(done);
        });
    });

    it('should 200 with messages', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CHANNEL
      }).then(function(channels) {
        channelId = channels._id;

        return Q.denodeify(app.lib.message.create)({
          channel: channelId,
          text: 'hello world',
          type: 'text',
          creator: userId
        });
      }).then(function() {
        return Q.denodeify(app.lib.message.create)({
          channel: channelId,
          text: 'Foo bar',
          type: 'text',
          creator: userId
        });
      }).then(function() {
        request(app.express)
          .get('/api/conversations/' + channelId + '/messages')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.length).to.equal(2);
            done();
          });
      }).catch(done);
    });

    it('should 200 with messages which are not moderated', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CHANNEL
      }).then(function(channels) {
        channelId = channels._id;

        return Q.denodeify(app.lib.message.create)({
          channel: channelId,
          text: 'hello world',
          type: 'text',
          moderate: true,
          creator: userId
        });
      }).then(function() {
        return Q.denodeify(app.lib.message.create)({
          channel: channelId,
          text: 'hello world',
          type: 'text',
          creator: userId
        });
      }).then(function(mongoResult) {
        request(app.express)
          .get('/api/conversations/' + channelId + '/messages')
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

    it('should 200 with messages before the given one', function(done) {
      let channelId;
      let before;
      const date = Date.now();
      const limit = 5;
      const size = 100;

      function createMessages() {

        function create(i) {
          return Q.denodeify(app.lib.message.create)({
            channel: channelId,
            text: String(i),
            type: 'text',
            timestamps: {
              creation: date + i
            },
            creator: userId
          }).then(function(message) {
            if (i === size / 2) {
              before = message;
            }

            return message;
          });
        }

        const promises = [];

        for (var i = 0; i < size; i++) {
          promises.push(create(i));
        }

        return Q.all(promises);
      }

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CHANNEL
      }).then(function(channel) {
        channelId = channel._id;

        return createMessages();
      }).then(function() {
        request(app.express)
          .get(`/api/conversations/${channelId}/messages?before=${before._id}&limit=${limit}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

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
          });
      }).catch(done);
    });
  });

  describe('GET /api/messages/:id', function() {
    it('should 404 when message does not exist', function(done) {
      request(app.express)
        .get('/api/messages/' + new mongoose.Types.ObjectId())
        .expect('Content-Type', /json/)
        .expect(404)
        .end(done);
    });

    it('should 404 when conversation of the message does not exist', function(done) {
      Q.denodeify(app.lib.message.create)({
        channel: new mongoose.Types.ObjectId(),
        text: 'hello world',
        type: 'text',
        creator: userId
      }).then(function(message) {
        request(app.express)
          .get('/api/messages/' + message._id)
          .expect('Content-Type', /json/)
          .expect(404)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not find conversation for message/);
            done();
          });
      }).catch(done);
    });

    it('should 200 with the message for channel conversation', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CHANNEL
      }).then(function(channels) {
        channelId = channels._id;

        return Q.denodeify(app.lib.message.create)({
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

    it('should 200 with the message for private conversation when user is member', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId]
      }).then(function(channels) {
        channelId = channels._id;

        return Q.denodeify(app.lib.message.create)({
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

    it('should 403 for private conversation when user is not member', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [new mongoose.Types.ObjectId()]
      }).then(function(channels) {
        channelId = channels._id;

        return Q.denodeify(app.lib.message.create)({
          channel: channelId,
          text: 'hello world',
          type: 'text',
          creator: userId
        });
      }).then(function(message) {
        request(app.express)
          .get('/api/messages/' + message._id)
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not read conversation/);
            done();
          });
      }).catch(done);
    });
  });

  describe('POST /api/conversations', function() {
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
              creator: userId.toString()
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

    it('should 403 when type is collaboration', function(done) {
      request(app.express)
        .post('/api/conversations')
        .type('json')
        .send({
          type: CONVERSATION_TYPE.COLLABORATION,
          name: 'name',
          topic: 'topic',
          purpose: 'purpose'
        })
        .expect(403)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body.error.details).to.match(/Can not create a collaboration conversation/);
          done();
        });
    });

    it('should not create a new conversation if the conversation has no name and an other with the same participant exist', function(done) {
      var members = [userId, new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: members
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.PRIVATE,
            members: members
          })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          expect(res.body).to.shallowDeepEqual({
            _id: id
          });

          done();
        });
      });
    });

    it('should not create a new conversation if the conversation has no name and an other with the same participant exist and has null for name', function(done) {
      var members = [userId, new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: members,
        name: null
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.PRIVATE,
            members: members
          })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          expect(res.body).to.shallowDeepEqual({
            _id: id
          });

          done();
        });
      });
    });

    it('should not create a new conversation if the conversation has a name and an other with the same participant exist and has the same name', function(done) {
      var members = [userId, new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: members,
        name: 'name'
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.PRIVATE,
            members: members,
            name: 'name'
          })
        .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body).to.shallowDeepEqual({
              _id: id
            });

            done();
          });
      });
    });

    it('should create a new conversation if the conversation has a name and an other with the same participant exist but has a different name', function(done) {
      var members = [userId, new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: members,
        name: 'name'
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.PRIVATE,
            members: members,
            name: 'name2'
          })
        .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body._id).to.not.equal(id);

            done();
          });
      });
    });

    it('should create a new conversation if the conversation has no name and an other with the same participant exist but has a name', function(done) {
      var members = [userId, new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: members,
        name: 'name'
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.PRIVATE,
            members: members
          })
        .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body._id).to.not.equal(id);

            done();
          });
      });
    });

    it('should create a new conversation if the conversation has a name and an other with the same participant exist but has no name', function(done) {
      var members = [userId, new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: members,
        name: null
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.PRIVATE,
            members: members,
            name: 'name2'
          })
        .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body._id).to.not.equal(id);

            done();
          });
      });
    });

    it('should not create the conversation if the conversation has a name and an other with the same participant exist and has the same name', function(done) {
      var members = [userId, new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: members,
        name: 'name'
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.PRIVATE,
            members: members,
            name: 'name'
          })
        .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body).to.shallowDeepEqual({
              _id: id
            });

            done();
          });
      });
    });
  });

  describe('POST /api/conversations/:id/readed', function() {

    it('should 404 when conversation is not found', function(done) {
      request(app.express)
        .post('/api/conversations/' + new mongoose.Types.ObjectId() + '/readed')
        .expect(404)
        .end(done);
    });

    it('should 403 when conversation is collaboration', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.COLLABORATION
      }, function(err, conversation) {
        err && done(err);

        request(app.express)
          .post('/api/conversations/' + conversation._id + '/readed')
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not update conversation/);
            done();
          });
        });
    });

    it('should 403 when conversation is private and user is not member', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [new mongoose.Types.ObjectId()],
        numOfMessage: 42
      }, function(err, conversation) {
        err && done(err);

        request(app.express)
          .post('/api/conversations/' + conversation._id + '/readed')
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not update conversation/);
            done();
          });
        });
    });

    it('should 204 when conversation is private and user is member', function(done) {
      var channelId;
      var numOfMessage = 42;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId],
        numOfMessage: numOfMessage
      }).then(function(mongoResponse) {
        channelId = mongoResponse._id;

        return Q.denodeify(function(callback) {
          request(app.express)
            .post('/api/conversations/' + channelId + '/readed')
            .expect(204)
            .end(callback);
        })();
      }).then(function() {
        return Q.denodeify(app.lib.conversation.getById)(channelId);
      }).then(function(channel) {
        var wanted = {};

        wanted[String(userId)] = numOfMessage;
        expect(channel.numOfReadedMessage).to.deep.equal(wanted);
        done();
      }).catch(done);
    });

    it('should 204 when conversation is channel', function(done) {
      var channelId;
      var numOfMessage = 42;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CHANNEL,
        numOfMessage: numOfMessage
      }).then(function(mongoResponse) {
        channelId = mongoResponse._id;

        return Q.denodeify(function(callback) {
          request(app.express)
            .post('/api/conversations/' + channelId + '/readed')
            .expect(204)
            .end(callback);
        })();
      }).then(function() {
        return Q.denodeify(app.lib.conversation.getById)(channelId);
      }).then(function(channel) {
        var wanted = {};

        wanted[String(userId)] = numOfMessage;
        expect(channel.numOfReadedMessage).to.deep.equal(wanted);
        done();
      }).catch(done);
    });
  });

  describe('PUT /api/conversations/:id/members/:user_id', function() {
    it('should 404 when conversation is not found', function(done) {
      request(app.express)
        .put('/api/conversations/' + new mongoose.Types.ObjectId() + '/members')
        .expect(404)
        .end(done);
    });

    it('should 404 when given user is not found', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CHANNEL
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + result._id + '/members/' + new mongoose.Types.ObjectId())
          .expect(404)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body.error.details).to.match(/Can not find user/);
            done();
          });
      });
    });

    it('should be able to add himself to channel conversation', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CHANNEL
      }).then(function(result) {
        channelId = result._id;

        return Q.denodeify(function(callback) {
          request(app.express)
            .put('/api/conversations/' + channelId + '/members/' + userId)
            .expect(204)
            .end(callback);
        })();
      }).then(function() {
        return Q.denodeify(app.lib.conversation.getById)(channelId);
      }).then(function(channel) {
        expect(channel.members).to.shallowDeepEqual({
          0: {_id: String(userId)},
          length: 1
        });
        done();
      }).catch(done);
    });

    it('should not be able to add another member to a channel conversation when not member', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CHANNEL
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + result._id + '/members/' + anotherUserId)
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not join conversation/);
            done();
          });
        });
    });

    it('should be able to add another member to a channel conversation when member', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CHANNEL,
        members: [userId]
      }).then(function(result) {
        channelId = result._id;

        return Q.denodeify(function(callback) {
          request(app.express)
            .put('/api/conversations/' + channelId + '/members/' + anotherUserId)
            .expect(204)
            .end(callback);
        })();
      }).then(function() {
        return Q.denodeify(app.lib.conversation.getById)(channelId);
      }).then(function(channel) {
        expect(channel.members).to.shallowDeepEqual({
          0: {_id: String(userId)},
          1: {_id: String(anotherUserId)},
          length: 2
        });
        done();
      }).catch(done);
    });

    it('should 404 when given user is not found and private conversation', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.PRIVATE
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + result._id + '/members/' + new mongoose.Types.ObjectId())
          .expect(404)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body.error.details).to.match(/Can not find user/);
            done();
          });
      });
    });

    it('should not be able to add another member to a private conversation when not member', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.PRIVATE,
        members: []
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + result._id + '/members/' + anotherUserId)
          //.expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not join conversation/);
            done();
          });
        });
    });

    it('should be able to add another member to a private conversation when member', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId]
      }).then(function(result) {
        channelId = result._id;

        return Q.denodeify(function(callback) {
          request(app.express)
            .put('/api/conversations/' + channelId + '/members/' + anotherUserId)
            .expect(204)
            .end(callback);
        })();
      }).then(function() {
        return Q.denodeify(app.lib.conversation.getById)(channelId);
      }).then(function(channel) {
        expect(channel.members).to.shallowDeepEqual({
          0: {_id: String(userId)},
          1: {_id: String(anotherUserId)},
          length: 2
        });
        done();
      }).catch(done);
    });

    it('should not be able to join a collaboration conversation', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.COLLABORATION
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .put('/api/conversations/' + result._id + '/members/' + userId)
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not join conversation/);
            done();
          });
      });
    });
  });

  describe('DELETE /api/conversations/:id/members/:user_id', function() {

    it('should 404 when conversation is not found', function(done) {
      request(app.express)
        .delete('/api/conversations/' + new mongoose.Types.ObjectId() + '/members/' + new mongoose.Types.ObjectId())
        .expect(404)
        .end(done);
    });

    it('should not be able to remove a member when not member of a channel conversation', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CHANNEL,
        members: [anotherUserId]
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .delete('/api/conversations/' + result._id + '/members/' + anotherUserId)
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body.error.details).to.match(/Can not leave conversation/);
            done();
          });
      });
    });

    it('should be able to remove another member when member of a channel conversation', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CHANNEL,
        members: [userId, anotherUserId]
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .delete('/api/conversations/' + result._id + '/members/' + anotherUserId)
          .expect(204)
          .end(function(err) {
            if (err) {
              return done(err);
            }
            Q.denodeify(app.lib.conversation.getById)(result._id).then(function(channel) {
              expect(channel.members).to.shallowDeepEqual({
                0: {_id: String(userId)},
                length: 1
              });
              done();
            }, done);
          });
        });
    });

    it('should be able to remove himself when member of a channel conversation', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CHANNEL,
        members: [userId, anotherUserId]
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .delete('/api/conversations/' + result._id + '/members/' + userId)
          .expect(204)
          .end(function(err) {
            if (err) {
              return done(err);
            }
            Q.denodeify(app.lib.conversation.getById)(result._id).then(function(channel) {
              expect(channel.members).to.shallowDeepEqual({
                0: {_id: String(anotherUserId)},
                length: 1
              });
              done();
            }, done);
          });
        });
    });

    it('should be able to remove a user when creator of a private conversation', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.PRIVATE,
        creator: userId,
        members: [userId, anotherUserId]
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .delete('/api/conversations/' + result._id + '/members/' + anotherUserId)
          .expect(204)
          .end(function(err) {
            if (err) {
              return done(err);
            }
            Q.denodeify(app.lib.conversation.getById)(result._id).then(function(channel) {
              expect(channel.members).to.shallowDeepEqual({
                0: {_id: String(userId)},
                length: 1
              });
              done();
            }, done);
          });
        });
    });

    it('should not be able to remove a user when not creator of a private conversation', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId, anotherUserId]
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .delete('/api/conversations/' + result._id + '/members/' + anotherUserId)
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not leave conversation/);
            done();
          });
        });
    });

    it('should be able to leave a private conversation by himself', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId, anotherUserId]
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .delete('/api/conversations/' + result._id + '/members/' + userId)
          .expect(204)
          .end(function(err) {
            if (err) {
              return done(err);
            }
            Q.denodeify(app.lib.conversation.getById)(result._id).then(function(channel) {
              expect(channel.members).to.shallowDeepEqual({
                0: {_id: String(anotherUserId)},
                length: 1
              });
              done();
            }, done);
          });
        });
    });

    it('should not be able to leave a collaboration conversation', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.COLLABORATION
      }, function(err, result) {
        err && done(err);
        request(app.express)
          .delete('/api/conversations/' + result._id + '/members/' + userId)
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not leave conversation/);
            done();
          });
        });
    });
  });

  describe('GET /api/collaborations/conversations/:objectType/:id', function() {
    it('should return collaboration conversation with the given collaboration tuple is provided', function(done) {
      var channel;
      const collaboration = {id: '1', objectType: 'community'};

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.COLLABORATION,
        collaboration: collaboration
      }).then(function(result) {
        channel = result;
        request(app.express)
          .get(`/api/collaborations/conversations/${collaboration.objectType}/${collaboration.id}`)
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

    it('should return 403 if user try to get a collaboration where he is not member', function(done) {
      const tuple = {id: '1', objectType: 'community'};

      collaboration = {};
      writable = false;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.COLLABORATION,
        collaboration: collaboration
      }).then(function() {
        request(app.express)
          .get(`/api/collaborations/conversations/${tuple.objectType}/${tuple.id}`)
          .expect(403, done);
      }).catch(done);
    });

    it('should 404 if the collaboration does not exist', function() {
      const tuple = {id: '1', objectType: 'community'};

      collaboration = null;

      request(app.express)
        .get(`/api/collaborations/conversations/${tuple.objectType}/${tuple.id}`)
        .expect(404);
    });
  });

  describe('GET /api/conversations', function() {
    it('should return non moderate private conversations with given participants parameters', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();
      var channel;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        moderate: true,
        members: [userId, otherMember1, otherMember2]
      }).then(function() {
        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2]
        });
      }).then(function(mongoResponse) {
        channel = mongoResponse;
        request(app.express)
          .get('/api/conversations?type=private&members=' + otherMember1.toString() + '&members=' + otherMember2.toString())
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

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId, otherMember1, otherMember2]
      }).then(function() {
        request(app.express)
          .get('/api/conversations?type=private&members=' + otherMember1.toString())
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

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId, otherMember1, otherMember2]
      }).then(function() {
        request(app.express)
          .get('/api/conversations?type=private')
          .expect(400, done);
      }).catch(done);
    });

    it('should not return private conversations without the current user', function(done) {
      var otherMember = new mongoose.Types.ObjectId();

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [otherMember]
      }).then(function() {
        request(app.express)
          .get('/api/conversations?type=private&members=' + otherMember.toString())
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

  describe('GET /api/user/conversations/private', function() {
    it('should return all private conversations with me inside that are not moderated', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();
      var channel;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [otherMember1, otherMember2]
      }).then(function() {
        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.PRIVATE,
          moderate: true,
          members: [userId, otherMember2]
        });
      }).then(function() {
        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2]
        });
      }).then(function(mongoResponse) {
        channel = mongoResponse;
        request(app.express)
          .get('/api/user/conversations/private')
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

  describe('GET /api/user/conversations', function() {
    it('should return all conversation with me inside that are not moderated', function(done) {
      var otherMember1 = new mongoose.Types.ObjectId();
      var otherMember2 = new mongoose.Types.ObjectId();
      var channel1, channel2;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        timestamps: {creation: new Date(2e6)},
        members: [userId, otherMember2]
      }).then(function(mongoResponse) {
        channel1 = mongoResponse;

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.PRIVATE,
          moderate: true,
          members: [userId, otherMember2],
          timestamps: {creation: new Date(1e6)}
        });
      }).then(function() {
        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2],
          timestamps: {creation: new Date(1e6)}
        });
      }).then(function(mongoResponse) {
        channel2 = mongoResponse;

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [otherMember1, otherMember2],
          timestamps: {creation: new Date(0)}
        });
      }).then(function() {
        request(app.express)
          .get('/api/user/conversations')
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
      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CHANNEL,
        members: []
      }).then(function(mongoResponse) {
        request(app.express)
          .get('/api/user/conversations')
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

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId, otherMember1, otherMember2],
        last_message: {date: new Date(1469605336000)}
      }).then(function(mongoResponse) {
        channel1 = mongoResponse;

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2],
          last_message: {date: new Date(1469605337000)}
        });
      }).then(function(mongoResponse) {
        channel2 = mongoResponse;
        request(app.express)
          .get('/api/user/conversations')
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
      var channel2;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.COLLABORATION,
        collaboration: {id: '1', objectType: 'community'},
        members: [userId, otherMember1, otherMember2]
      }).then(function() {
        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2]
        });
      }).then(function(mongoResponse) {
        channel2 = mongoResponse;

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [otherMember1, otherMember2]
        });
      }).then(function() {
        request(app.express)
          .get('/api/user/conversations?type=private')
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

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CHANNEL,
        members: [userId, otherMember1, otherMember2],
        timestamps: {creation: new Date(1e6)}
      }).then(function(mongoResponse) {
        channel1 = mongoResponse;

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.PRIVATE,
          members: [userId, otherMember1, otherMember2],
          timestamps: {creation: new Date(2e6)}
        });
      }).then(function(mongoResponse) {
        channel2 = mongoResponse;

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.COLLABORATION,
          collaboration: {id: '1', objectType: 'community'},
          members: [userId, otherMember1, otherMember2],
          timestamps: {creation: new Date(3e6)}
        });
      }).then(function() {
        request(app.express)
          .get('/api/user/conversations?type=private&type=channel')
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
  });

  describe('GET /api/user/collaborations/conversations', function() {
    it('should return all collaboration conversations where current user is member', function(done) {
      collaborations = [{_id: '1', objectType: 'community'}, {_id: '2', objectType: 'project'}, {_id: '3', objectType: 'issue'}];
      var conversation1, conversation2;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.COLLABORATION,
        collaboration: {id: collaborations[0]._id, objectType: collaborations[0].objectType}
      })
      .then(function(result) {
        conversation1 = result;

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.COLLABORATION,
          collaboration: {id: '2', objectType: 'community'},
          moderate: true
        });
      })
      .then(function() {
        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.COLLABORATION,
          collaboration: {id: collaborations[1]._id, objectType: collaborations[1].objectType}
        });
      })
      .then(function(result) {
        conversation2 = result;
        request(app.express)
          .get('/api/user/collaborations/conversations')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual({
              0: jsonnify(conversation1),
              1: jsonnify(conversation2),
              length: 2
            });
            done();
          });
      }).catch(done);
    });

    it('should set conversation members from the collaboration members', function(done) {
      collaborations = [{
        _id: '1',
        objectType: 'community',
        members: [
          {member: {id: String(userId), objectType: 'user'}, status: 'joined'},
          {member: {id: '3', objectType: 'user'}, status: 'foobar'},
          {member: {id: '4', objectType: 'notuser'}, status: 'joined'}
        ]
      }];
      collaboration = collaborations[0];

      app.lib.conversation.create({
        type: CONVERSATION_TYPE.COLLABORATION,
        collaboration: {id: collaborations[0]._id, objectType: collaborations[0].objectType}
      }, function() {
        request(app.express)
          .get('/api/user/collaborations/conversations')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual([
              {
                type: CONVERSATION_TYPE.COLLABORATION,
                collaboration: {id: collaborations[0]._id, objectType: collaborations[0].objectType},
                members: [
                  {_id: String(userId)}
                ]
              }
            ]);
            done();
          });
        });
    });
  });

  describe('DELETE /api/conversations/:id', function() {

    it('should 404 when the conversation does not exist', function(done) {
      request(app.express)
        .delete('/api/conversations/' + new mongoose.Types.ObjectId())
        .expect(404)
        .end(done);
    });

    it('should 403 when conversation is channel', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CHANNEL,
        members: [userId, new mongoose.Types.ObjectId()]
      }).then(function(mongoResponse) {
        channelId = mongoResponse._id;

        return Q.denodeify(function(callback) {
          request(app.express)
            .delete('/api/conversations/' + channelId)
            .expect(403)
            .end(callback);
        })();
      }).then(function() {
        return Q.denodeify(app.lib.conversation.getById)(channelId);
      }).then(function(channel) {
        expect(channel).to.not.be.null;
        done();
      }).catch(done);
    });

    it('should 403 when conversation is private and user is not member', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .delete('/api/conversations/' + conversation._id)
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not remove conversation/);
            done();
          });
        });
    });

    it('should 204 when conversation is private and user is member', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId, new mongoose.Types.ObjectId()]
      }).then(function(mongoResponse) {
        channelId = mongoResponse._id;

        return Q.denodeify(function(callback) {
          request(app.express)
            .delete('/api/conversations/' + channelId)
            .expect(204)
            .end(callback);
        })();
      }).then(function() {
        return Q.denodeify(app.lib.conversation.getById)(channelId);
      }).then(function(channel) {
        expect(channel).to.be.null;
        done();
      }).catch(done);
    });

    it('should 403 when trying to delete a collaboration conversation', function(done) {
      app.lib.conversation.create({
        type: CONVERSATION_TYPE.COLLABORATION
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .delete('/api/conversations/' + conversation._id)
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not remove conversation/);
            done();
          });
      });
    });
  });
});
