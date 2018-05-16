'use strict';

const request = require('supertest');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const Q = require('q');
const redis = require('redis');
const async = require('async');
const pubsub = require('linagora-rse/backend/core/pubsub');
const CONSTANTS = require('../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;

describe('The chat API', function() {

  let deps, mongoose, userId, user, anotherUserId, anotherUser, app, redisClient, collaborations, collaboration, writable, readable, getNewMember, userAsMember;
  let userDomains, anotherUserDomains, starredMessage, loadedDomain, isDomainAdministrator, isManager;

  function dependencies(name) {
    return deps[name];
  }

  function asMember(id) {
    return {member: {id: String(id), objectType: 'user'}};
  }

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
    readable = true;
    isDomainAdministrator = true;
    isManager = true;
    loadedDomain = { _id: 123, administrator: 123, timestamps: {} };

    getNewMember = function() {
      return asMember(new mongoose.Types.ObjectId());
    };

    userAsMember = asMember(userId);

    starredMessage = {
      _id: '123'
    };

    deps = {
      logger: require('../fixtures/logger'),
      resourceLink: {
        exists: function(request) {
          return Q.when(String(request.target.id) === String(starredMessage._id));
        }
      },
      user: {
        moderation: {registerHandler: _.constant()},
        get: function(id, callback) {
          mongoose.model('User').findOne({_id: id}, callback);
        }
      },
      collaboration: {
        registerCollaborationModel: function(objectType, name, schema) {
          return mongoose.model(name, schema);
        },
        getCollaborationsForUser: function(user, options, callback) {
          callback(null, collaborations);
        },
        queryOne: function(tuple, query, callback) {
          callback(null, collaboration);
        },
        member: {
          isMember: function(collaboration, tuple, callback) {
            callback(null, _.find(collaboration.members, userAsMember));
          },
          isManager: function(objectType, collaboration, user, callback) {
            callback(null, isManager);
          },
          countMembers: function(objectType, id, callback) {
            callback(null, 0);
          },
          join: sinon.spy(function(objectType, collaboration, userAuthor, userTarget, actor, callback) {
            callback();
          })
        },
        permission: {
          canRead: function(collaboration, tuple, callback) {
            callback(null, readable);
          },
          canWrite: function(collaboration, tuple, callback) {
            callback(null, writable);
          }
        }
      },
      collaborationMW: {
        load: function() {},
        requiresCollaborationMember: function() {}
      },
      domain: {
        userIsDomainAdministrator: function(user, domain, callback) {
          callback(null, isDomainAdministrator);
        },
        load: function(domainId, callback) {
          callback(null, loadedDomain);
        }
      },
      resourceLinkMW: {
        addCanCreateMiddleware: function() {}
      },
      elasticsearch: {
        listeners: {
          addListener: function() {}
        }
      },
      pubsub: pubsub,
      db: {
        mongo: {
          mongoose: mongoose,
          models: {
            'base-collaboration': function(definition) {
              const Tuple = new mongoose.Schema({
                objectType: {type: String, required: true},
                id: {type: mongoose.Schema.Types.Mixed, required: true}
              }, {_id: false});

              definition.members = [
                {
                  member: {type: Tuple.tree, required: true},
                  status: {type: String},
                  timestamps: {
                    creation: {type: Date, default: Date.now}
                  }
                }
              ];

              definition.domain_ids = [{ type: mongoose.Schema.ObjectId, ref: 'Domain'}];
              definition.creator = [{ type: mongoose.Schema.ObjectId, ref: 'User' }];

              return new mongoose.Schema(definition);
            }
          }
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
            _id: userId,
            domains: userDomains
          };
          next();
        }
      },
      denormalizeUser: {
        denormalize: function(member) {
          return Q.when(member);
        }
      },
      i18n: this.helpers.i18n
    };

    app = this.helpers.loadApplication(dependencies);
    var UserSchema = mongoose.model('User');

    userDomains = [{domain_id: new mongoose.Types.ObjectId()}];
    anotherUserDomains = [{domain_id: new mongoose.Types.ObjectId()}];

    user = new UserSchema({
      _id: userId,
      firstname: 'Eric',
      username: 'eric.cartman',
      lastname: 'Cartman',
      domains: [userDomains]
    });

    anotherUser = new UserSchema({
      _id: anotherUserId,
      firstname: 'Chuck',
      username: 'Chuck Norris',
      lastname: 'Norris',
      domains: [anotherUserDomains]
    });

    Q.all([user.save(), anotherUser.save()]).then(() => {
      done();
    }, done);
  });

  afterEach(function(done) {
    async.parallel([this.helpers.mongo.dropDatabase, this.helpers.resetRedis], done);
  });

  describe('GET /api/conversations', function() {
    it('should return a default channel', function(done) {
      request(app.express)
        .get('/api/conversations')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          expect(res.body.length).to.equal(1);
          expect(res.body).to.shallowDeepEqual([{name: CONSTANTS.DEFAULT_CHANNEL.name}]);
          done();
        });
    });

    it('should not create the default channel if already exists', function(done) {
      const options = {
        domainId: userDomains[0].domain_id
      };

      Q.denodeify(app.lib.conversation.createDefaultChannel)(options).then(test, done);

      function test(defaultChannel) {
        if (!defaultChannel) {
          return done(new Error('Default channel should have been created'));
        }

        request(app.express)
          .get('/api/conversations')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body.length).to.equal(1);
            expect(res.body).to.shallowDeepEqual([{_id: String(defaultChannel._id), name: CONSTANTS.DEFAULT_CHANNEL.name}]);
            done();
          });
        }
    });

    it('should join the default channel if not already member', function(done) {
      const options = {
        domainId: userDomains[0].domain_id
      };

      deps.collaboration.member.isMember = sinon.spy(function(collaration, tuple, callback) {
        callback(null, false);
      });

      Q.denodeify(app.lib.conversation.createDefaultChannel)(options).then(test, done);

      function test(defaultChannel) {
        if (!defaultChannel) {
          return done(new Error('Default channel should have been created'));
        }

        request(app.express)
          .get('/api/conversations')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body.length).to.equal(1);
            expect(res.body).to.shallowDeepEqual([{name: CONSTANTS.DEFAULT_CHANNEL.name}]);
            expect(deps.collaboration.member.isMember).to.have.been.called;
            expect(deps.collaboration.member.join).to.have.been.called;
            expect(deps.collaboration.member.join.firstCall.args[0]).to.equal(CONSTANTS.OBJECT_TYPES.CONVERSATION);
            expect(String(deps.collaboration.member.join.firstCall.args[1]._id)).to.equal(String(defaultChannel._id));
            expect(String(deps.collaboration.member.join.firstCall.args[2]._id)).to.equal(String(user._id));
            expect(String(deps.collaboration.member.join.firstCall.args[3]._id)).to.equal(String(user._id));
            expect(String(deps.collaboration.member.join.firstCall.args[4]._id)).to.equal(String(user._id));
            done();
          });
        }
    });

    it('should not join the default channel if already member', function(done) {
      const options = {
        domainId: userDomains[0].domain_id
      };

      deps.collaboration.member.isMember = sinon.spy(function(collaration, tuple, callback) {
        callback(null, true);
      });

      Q.denodeify(app.lib.conversation.createDefaultChannel)(options).then(test, done);

      function test(defaultChannel) {
        if (!defaultChannel) {
          return done(new Error('Default channel should have been created'));
        }

        request(app.express)
          .get('/api/conversations')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body.length).to.equal(1);
            expect(res.body).to.shallowDeepEqual([{name: CONSTANTS.DEFAULT_CHANNEL.name}]);
            expect(deps.collaboration.member.isMember).to.have.been.called;
            expect(deps.collaboration.member.join).to.not.have.been.called;
            done();
          });
        }
    });

    it('should return an array of non moderated channels', function(done) {
      function execTest(channel1, channel2, channel3) {
        request(app.express)
          .get('/api/conversations')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body.length).to.equal(3);

            const channel1InBody = res.body.find(conversation => (conversation._id === String(channel1._id)));
            const channel2InBody = res.body.find(conversation => (conversation._id === String(channel2._id)));
            const channel3InBody = res.body.find(conversation => (conversation._id === String(channel3._id)));

            expect(channel1InBody).to.not.exist;
            expect(channel2InBody).to.exist;
            expect(channel3InBody).to.exist;

            done();
          });
      }

      Q.all([
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL,
          moderate: true
        }),
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL
        }),
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL
        })
      ])
      .spread(execTest)
      .catch(done);
    });

    it('should return an array open channels', function(done) {
      function execTest(channel1, channel2, channel3) {
        request(app.express)
          .get('/api/conversations')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.body.length).to.equal(3);
            expect(res.body).to.shallowDeepEqual([{_id: String(channel1._id)}, {_id: String(channel3._id)}, {name: CONSTANTS.DEFAULT_CHANNEL.name}]);
            done();
          });
      }

      Q.all([
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL
        }),
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          mode: CONVERSATION_MODE.CHANNEL
        }),
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL
        })
      ]).spread(execTest).catch(done);
    });

    it('should return the number of conversations defined by the limit parameter', function(done) {
      function execTest() {
        request(app.express)
          .get('/api/conversations?limit=2')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.headers['x-esn-items-count']).to.equal('4');
            expect(res.body.length).to.equal(2);
            done();
          });
      }

      Q.all([
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL
        }),
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL
        }),
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL
        })
      ])
      .then(execTest)
      .catch(done);
    });

    it('should offset results from the offset parameter', function(done) {
      function execTest() {
        request(app.express)
          .get('/api/conversations?offset=3')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }

            expect(res.headers['x-esn-items-count']).to.equal('4');
            expect(res.body.length).to.equal(1);
            done();
          });
      }

      Q.all([
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL
        }),
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL
        }),
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL
        })
      ])
      .then(execTest)
      .catch(done);
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

    it('should 403 when conversation is confidential and current user is not member', function(done) {
      readable = false;

      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [getNewMember(), getNewMember()]
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

    it('should 200 when conversation is confidential and current user is member', function(done) {
      readable = true;

      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [getNewMember(), userAsMember]
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

            expect(res.body).to.shallowDeepEqual({_id: String(channel._id)});
            done();
          });
      });
    });

    it('should 200 when the conversation is OPEN', function(done) {
      readable = true;

      app.lib.conversation.create({
        type: CONVERSATION_TYPE.OPEN
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

            expect(res.body).to.shallowDeepEqual({_id: String(channel._id)});
            done();
          });
      });

    });
  });

  describe('PUT /api/conversations/:id', function() {

    it('should not update the private conversation when user is not member', function(done) {
      const name = 'bar';

      writable = false;
      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.CONFIDENTIAL,
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
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [userAsMember]
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
        type: CONVERSATION_TYPE.OPEN
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

    it('should not update the private conversation when user is not member', function(done) {
      writable = false;

      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.CONFIDENTIAL,
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
      writable = true;

      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [userAsMember]
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
      writable = true;

      app.lib.conversation.create({
        name: 'foo',
        type: CONVERSATION_TYPE.OPEN
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
      readable = false;

      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [getNewMember()]
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
      let channelId;

      readable = true;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [userAsMember]
      }).then(function(channels) {
        channelId = channels._id;

        return Q.denodeify(app.lib.message.create)({
          channel: channelId,
          text: 'hello world',
          type: 'text',
          creator: userId
        });
      }).then(function(message) {
        starredMessage._id = message._id;

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
            expect(res.body[0].isStarred).to.be.true;
            expect(res.body[1].isStarred).to.be.false;
            done();
          });
      }).catch(done);
    });

    it('should 200 with messages', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN
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
      }).then(function(message) {
        starredMessage._id = message._id;

        request(app.express)
          .get('/api/conversations/' + channelId + '/messages')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.length).to.equal(2);
            expect(res.body[0].isStarred).to.be.false;
            expect(res.body[1].isStarred).to.be.true;
            done();
          });
      }).catch(done);
    });

    it('should 200 with messages which are not moderated', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN
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

            const expected = JSON.parse(JSON.stringify(mongoResult));

            expected.creator = {
              username: user.username,
              _id: String(user._id),
              __v: 0
            };

            expect(res.body).to.shallowDeepEqual([expected]);
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
        type: CONVERSATION_TYPE.OPEN
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

  describe('GET /api/conversations/:id/attachments', function() {

    it('should 404 when conversation does not exist', function(done) {
      request(app.express)
        .get('/api/conversations/' + new mongoose.Types.ObjectId() + '/attachments')
        .expect('Content-Type', /json/)
        .expect(404)
        .end(done);
    });

    it('should 403 when private conversation and user is not member', function(done) {
      readable = false;

      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [getNewMember()]
      }, function(err, conversation) {
        err && done(err);
        request(app.express)
          .get('/api/conversations/' + conversation._id + '/attachments')
          .expect('Content-Type', /json/)
          .expect(403)
          .end(done);
        });
    });

    it('should return empty result when messages does not contain attachments', function(done) {
      let channelId;
      const limit = 10;
      const offset = 0;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN
      })
        .then(function(channels) {
          channelId = channels._id;

          return Q.denodeify(app.lib.message.create)({
            channel: channelId,
            text: 'hello world',
            type: 'text',
            creator: userId,
            attachments: []
          });
        })
        .then(function() {
          return Q.denodeify(app.lib.message.create)({
            channel: channelId,
            text: 'Foo bar',
            type: 'text',
            creator: userId,
            attachments: []
          });
        })
        .then(function() {
          request(app.express)
            .get('/api/conversations/' + channelId + '/attachments?limit=' + limit + '&offset=' + offset)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err);
              }
              expect(res.body.length).to.equal(0);
              done();
            });
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
          creator: String(userId),
          timestamps: {
            creation: new Date(index).toISOString()
          },
          attachments: attachements
        };

        return coreMessage;
      }

      function createMessagesWithAttachments(messageSequence, channelId) {

        return Q.all(messageSequence.map((sequence, i) => { Q.denodeify(app.lib.message.create)(createMessage(sequence, i + 1, channelId));}));
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

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.OPEN
        }).then(function(channels) {
          channelId = channels._id;
        });
      }

      function test(limit, offset, limitToExpect, offsetToExpect, channelId) {
        const defer = Q.defer();

        request(app.express)
          .get('/api/conversations/' + channelId + '/attachments?limit=' + limit + '&offset=' + offset)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              defer.reject(err);
            }

            expect(res.body.length).to.equal(limitToExpect - offsetToExpect);
            expect(res.body).to.shallowDeepEqual(getExpectedData(messageSequence, channelId, limitToExpect, offsetToExpect));
            defer.resolve();
          });

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

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN
      })
        .then(function(channels) {
          channelId = channels._id;

          return Q.denodeify(app.lib.message.create)({
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
        .then(function() {
          return Q.denodeify(app.lib.message.create)({
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
          });
        })
        .then(function() {
          request(app.express)
            .get('/api/conversations/' + channelId + '/attachments?limit=' + limit + '&offset=' + offset)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err) {
              if (err) {
                return done(err);
              }
              done();
            });
      })
      .catch(done);
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
        type: CONVERSATION_TYPE.OPEN
      }).then(function(channels) {
        channelId = channels._id;

        return Q.denodeify(app.lib.message.create)({
          channel: channelId,
          text: 'hello world',
          type: 'text',
          creator: userId
        });
      }).then(function(mongoResult) {
        starredMessage._id = mongoResult._id;

        request(app.express)
          .get('/api/messages/' + mongoResult._id)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual(JSON.parse(JSON.stringify(mongoResult)));
            expect(res.body.isStarred).to.be.true;

            done();
          });
      }).catch(done);
    });

    it('should 200 with the message for private conversation when user is member', function(done) {
      var channelId;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [userAsMember]
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
            expect(res.body).to.shallowDeepEqual(JSON.parse(JSON.stringify(mongoResult)));
            expect(res.body.isStarred).to.be.false;

            done();
          });
      }).catch(done);
    });

    it('should 403 for private conversation when user is not member', function(done) {
      var channelId;

      readable = false;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [getNewMember()]
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
    it('should create a conversation', function(done) {
      request(app.express)
        .post('/api/conversations')
        .type('json')
        .send({
          type: CONVERSATION_TYPE.OPEN,
          mode: CONVERSATION_MODE.CHANNEL,
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
            type: CONVERSATION_TYPE.OPEN,
            mode: CONVERSATION_MODE.CHANNEL,
            topic: {
              value: 'topic',
              creator: userId.toString()
            },
            purpose: {
              value: 'purpose', creator: userId.toString()
            }
          });
          done();
        });
    });

    it('should not create a new conversation if the conversation has no name and an other with the same participant exist', function(done) {
      var members = [userAsMember, getNewMember(), getNewMember()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        members: members
      }).then(function(conversation) {
        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.CONFIDENTIAL,
            mode: CONVERSATION_MODE.CHANNEL,
            members: members.map(member => member.member.id)
          })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          expect(res.body).to.shallowDeepEqual({
            _id: String(conversation._id)
          });

          done();
        });
      }, done);
    });

    it('should not create a new conversation if the conversation has no name and an other with the same participant exist and has null for name', function(done) {
      var members = [userAsMember, getNewMember(), getNewMember()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        members: members,
        name: null
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.CONFIDENTIAL,
            mode: CONVERSATION_MODE.CHANNEL,
            members: members.map(member => member.member.id)
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
      var members = [userAsMember, getNewMember(), getNewMember()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        members: members,
        name: 'name'
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.CONFIDENTIAL,
            mode: CONVERSATION_MODE.CHANNEL,
            members: members.map(member => member.member.id),
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
      var members = [userAsMember, getNewMember(), getNewMember()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        members: members,
        name: 'name'
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.CONFIDENTIAL,
            mode: CONVERSATION_MODE.CHANNEL,
            members: members.map(member => member.member.id),
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
      var members = [userAsMember, getNewMember(), getNewMember()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        members: members,
        name: 'name'
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.CONFIDENTIAL,
            mode: CONVERSATION_MODE.CHANNEL,
            members: members.map(member => member.member.id)
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
      var members = [userAsMember, getNewMember(), getNewMember()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        members: members,
        name: null
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.CONFIDENTIAL,
            mode: CONVERSATION_MODE.CHANNEL,
            members: members.map(member => member.member.id),
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
      var members = [userAsMember, getNewMember(), getNewMember()];

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        members: members,
        name: 'name'
      }).then(function(mongoResponse) {
        var id = mongoResponse._id.toString();

        request(app.express)
          .post('/api/conversations')
          .type('json')
          .send({
            type: CONVERSATION_TYPE.CONFIDENTIAL,
            mode: CONVERSATION_MODE.CHANNEL,
            members: members.map(member => member.member.id),
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

  describe('POST /api/conversations/:id/archive', function() {

    it('should 403 when conversation is not a public channel', function(done) {

      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [getNewMember()],
        numOfMessage: 1
      }, function(err, conversation) {
        err && done(err);

        request(app.express)
          .post('/api/conversations/' + conversation._id + '/archive')
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/Can not archive a conversation which is not an open channel/);
            done();
          });
        });
    });

    it('should 403 when user is not a domain administrator nor a channel creator', function(done) {
      isDomainAdministrator = false;
      isManager = false;

      const options = {
        type: CONVERSATION_TYPE.OPEN,
        domain_id: [new mongoose.Types.ObjectId()]
      };

      app.lib.conversation.create(options
        , function(err, conversation) {
        err && done(err);
        request(app.express)
          .post('/api/conversations/' + conversation._id + '/archive')
          .expect(403)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.error.details).to.match(/You can not archive a conversation/);
            done();
          });
        });
    });

    it('should 200 when user is manager of the conversation', function(done) {
      isDomainAdministrator = false;
      isManager = true;

      const options = {
        type: CONVERSATION_TYPE.OPEN,
        domain_id: ['590b25074a86f858e3ec71eb']
      };

      app.lib.conversation.create(options
        , function(err, conversation) {
        err && done(err);
        request(app.express)
          .post('/api/conversations/' + conversation._id + '/archive')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual({archived: true});
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

    it('should 403 when conversation is private and user is not member', function(done) {
      writable = false;

      app.lib.conversation.create({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [getNewMember()],
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
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [userAsMember],
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
        const expected = {
          [String(userId)]: {
            numOfReadMessages: numOfMessage,
            numOfUnseenMentions: 0
          }
        };

        expect(channel.memberStates).to.deep.equal(expected);
        done();
      }).catch(done);
    });

    it('should 204 when conversation is channel', function(done) {
      var channelId;
      var numOfMessage = 42;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
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
        const expected = {
          [String(userId)]: {
            numOfReadMessages: numOfMessage,
            numOfUnseenMentions: 0
          }
        };

        expect(channel.memberStates).to.deep.equal(expected);
        done();
      }).catch(done);
    });
  });

  describe('GET /api/user/conversations/private', function() {
    it('should return all confidential conversations with me inside which are not moderated', function(done) {
      var otherMember1 = getNewMember();
      var otherMember2 = getNewMember();

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        mode: CONVERSATION_MODE.CHANNEL,
        members: [otherMember1, otherMember2]
      }).then(function() {
        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          mode: CONVERSATION_MODE.CHANNEL,
          moderate: true,
          members: [userAsMember, otherMember2]
        });
      }).then(function() {
        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          mode: CONVERSATION_MODE.CHANNEL,
          members: [userAsMember, otherMember1, otherMember2]
        });
      }).then(function(channel) {
        request(app.express)
          .get('/api/user/conversations/private')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body.length).to.equal(1);
            expect(res.body).to.shallowDeepEqual([{_id: String(channel._id)}]);
            done();
          });
      }).catch(done);
    });
  });

  describe('GET /api/user/conversations', function() {
    it('should return all conversations with me inside which are not moderated', function(done) {
      var otherMember1 = getNewMember();
      var otherMember2 = getNewMember();
      var channel1, channel2;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        timestamps: {creation: new Date(2e6)},
        members: [userAsMember, otherMember2]
      }).then(function(mongoResponse) {
        channel1 = mongoResponse;

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          moderate: true,
          members: [userAsMember, otherMember2],
          timestamps: {creation: new Date(1e6)}
        });
      }).then(function() {
        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          members: [userAsMember, otherMember1, otherMember2],
          timestamps: {creation: new Date(1e6)}
        });
      }).then(function(mongoResponse) {
        channel2 = mongoResponse;

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
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
            expect(res.body.length).to.equal(2);
            expect(res.body).to.shallowDeepEqual([{_id: String(channel1._id)}, {_id: String(channel2._id)}]);
            done();
          });
      }).catch(done);
    });

    it('should not return channel if I am not a member of them yet', function(done) {
      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.OPEN,
        members: []
      }).then(function() {
        request(app.express)
          .get('/api/user/conversations')
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual([]);
            done();
          });
      }).catch(done);
    });

    it('should put conversation with the most recent last message first', function(done) {
      var otherMember1 = getNewMember();
      var otherMember2 = getNewMember();
      var channel1, channel2;

      Q.denodeify(app.lib.conversation.create)({
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [userAsMember, otherMember1, otherMember2],
        last_message: {date: new Date(1469605336000)}
      }).then(function(mongoResponse) {
        channel1 = mongoResponse;

        return Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.CONFIDENTIAL,
          members: [userAsMember, otherMember1, otherMember2],
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
            expect(res.body).to.shallowDeepEqual([{_id: String(channel2._id)}, {_id: String(channel1._id)}]);
            done();
          });
      }).catch(done);
    });

    it('should return only unread conversations if unread query param = true', function(done) {
      const member1 = getNewMember();
      const member2 = getNewMember();
      const numOfMessage = 2;
      const conversationJSON1 = {
        type: CONVERSATION_TYPE.OPEN,
        members: [userAsMember, member1, member2],
        numOfMessage,
        memberStates: {
          [String(userId)]: {
            numOfReadMessages: 1,
            numOfUnseenMentions: 0
          }
        }
      };
      const conversationJSON2 = {
        type: CONVERSATION_TYPE.OPEN,
        members: [userAsMember, member1, member2],
        numOfMessage,
        memberStates: {
          [String(userId)]: {
            numOfReadMessages: numOfMessage,
            numOfUnseenMentions: 0
          }
        }
      };

      Q.all([
        Q.denodeify(app.lib.conversation.create)(conversationJSON1),
        Q.denodeify(app.lib.conversation.create)(conversationJSON2)
      ])
      .spread(conversation1 => {
        request(app.express)
          .get('/api/user/conversations')
          .query({ unread: true })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }

            expect(res.body.length).to.equal(1);
            expect(res.body).to.shallowDeepEqual([{_id: String(conversation1._id)}]);
            done();
          });
      })
      .catch(done);
    });
  });

  describe('GET /api/user/privateConversations/', function() {

    it('should return an empty array when the subscribed conversation document does not exist', function(done) {

        request(app.express)
          .get('/api/user/privateConversations')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual([]);
            done();
          });
      });

    it('should return the array of all subscribed private conversations', function(done) {

      Q.all([
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.DIRECT_MESSAGE,
          mode: CONVERSATION_MODE.CHANNEL,
          moderate: true
        }),
        Q.denodeify(app.lib.conversation.create)({
          type: CONVERSATION_TYPE.DIRECT_MESSAGE,
          mode: CONVERSATION_MODE.CHANNEL,
          moderate: true
        })
      ])
      .spread(executeTest).catch(done);

      function executeTest(conversation1, conversation2) {
        app.lib.userSubscribedPrivateConversation.store(
          userId,
          [conversation1._id, conversation2._id]
        ).then(function() {
          request(app.express)
            .get('/api/user/privateConversations')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
              if (err) {
                return done(err);
              }

              expect(res.body).to.shallowDeepEqual([JSON.parse(JSON.stringify(conversation1)), JSON.parse(JSON.stringify(conversation2))]);
              done();
            });
          }).catch(done);
        }
      });
    });

  describe('PUT /api/user/privateConversations/', function() {

    it('should create the subscribed conversation document', function(done) {
      const conv1 = new mongoose.Types.ObjectId();
      const conv2 = new mongoose.Types.ObjectId();
      const conversationIds = [conv1, conv2];

        request(app.express)
          .put('/api/user/privateConversations')
          .send({conversationIds: conversationIds})
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual([String(conv1), String(conv2)]);
            done();
          });
      });

    it('should update the array of all subscribed private conversations', function(done) {
      const conv1 = new mongoose.Types.ObjectId();
      const conv2 = new mongoose.Types.ObjectId();
      const conversationIds = [conv1, conv2];

      app.lib.userSubscribedPrivateConversation.store(
        userId,
        conversationIds
      ).then(function() {
        request(app.express)
          .put('/api/user/privateConversations')
          .send({conversationIds: [conv1]})
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual([String(conv1)]);
            done();
          });
        }).catch(done);
      });

      it('should 400 when the conversationIds is not an array', function(done) {

          request(app.express)
            .put('/api/user/privateConversations')
            .send({conversationIds: 'notarray'})
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function(err, res) {
              if (err) {
                return done(err);
              }
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad request',
                  details: 'You should provide the private conversations ids array'
                }
              });
              done();
            });
        });

      it('should 400 when the conversationIds is not objectId convertable', function(done) {

          request(app.express)
            .put('/api/user/privateConversations')
            .send({conversationIds: ['notid']})
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function(err, res) {
              if (err) {
                return done(err);
              }
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad request',
                  details: 'You should provide valid ids array'
                }
              });
              done();
            });
        });

      it('should 400 when there is no request body', function(done) {

          request(app.express)
            .put('/api/user/privateConversations')
            .send()
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function(err, res) {
              if (err) {
                return done(err);
              }
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad request',
                  details: 'You should provide the private conversations ids array'
                }
              });
              done();
            });
        });

    });
  });
