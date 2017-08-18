'use strict';

const _ = require('lodash');
const Q = require('q');
const mockery = require('mockery');
const async = require('async');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

const logger = require('../fixtures/logger');
const CONSTANTS = require('../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('The Chat search API', function() {

  let deps, mongoose, userId, user, anotherUserId, anotherUser, app, userAsMember, userDomains, starredMessage;

  function dependencies(name) {
    return deps[name];
  }

  function asMember(id) {
    return {member: {id: String(id), objectType: 'user'}};
  }

  beforeEach(function(done) {
    const self = this;

    mongoose = require('mongoose');
    mongoose.Promise = Q.Promise;
    mongoose.connect(this.testEnv.mongoUrl);
    userId = mongoose.Types.ObjectId();
    anotherUserId = mongoose.Types.ObjectId();
    userAsMember = asMember(userId);
    userDomains = [{domain_id: new mongoose.Types.ObjectId()}];

    // all the following mockery calls are here to avoid to intialize OP.core but mock what is needed by ES and pubsub modules.
    mockery.registerMock('../esn-config', function() {
      return {
        get: function(callback) {
          return callback(null,
            {
              _id: 'elasticsearch',
              host: `${self.testEnv.serversConfig.host}:${self.testEnv.serversConfig.elasticsearch.port}`
            }
          );
        }
      };
    });

    // for local pubsub module
    mockery.registerMock('../../core', {
      logger: logger
    });

    mockery.registerMock('../config', function() {
      return {
        log: {
          console: {
            enabled: false
          },
          file: {
            enabled: false
          }
        }
      };
    });

    const localPubsub = require('linagora-rse/backend/core/pubsub/local');

    // for ES module
    mockery.registerMock('../pubsub', {
      local: localPubsub
    });

    const elasticsearch = require('linagora-rse/backend/core/elasticsearch');

    starredMessage = {
      _id: '9999'
    };

    deps = {
      logger: logger,
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
          callback(null, []);
        },
        queryOne: function(tuple, query, callback) {
          callback(null, {});
        },
        member: {
          isMember: function(collaboration, tuple, callback) {
            callback(null, _.find(collaboration.members, userAsMember));
          },
          countMembers: function(objectType, id, callback) {
            callback(null, 0);
          },
          join: function(objectType, collaboration, userAuthor, userTarget, actor, callback) {
            callback();
          }
        },
        permission: {
          canWrite: function(collaboration, tuple, callback) {
            callback(null, true);
          }
        }
      },
      collaborationMW: {
        load: function() {},
        requiresCollaborationMember: function() {}
      },
      resourceLinkMW: {
        addCanCreateMiddleware: function() {}
      },
      elasticsearch: elasticsearch,
      pubsub: {
        local: localPubsub,
        global: localPubsub
      },
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

              return new mongoose.Schema(definition);
            }
          }
        }
      },
      authorizationMW: {
        requiresAPILogin: function(req, res, next) {
          req.user = {
            _id: userId,
            domains: [userDomains]
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
    const UserSchema = mongoose.model('User');

    user = new UserSchema({
      _id: userId,
      firstname: 'Bruce',
      username: 'bwillis',
      lastname: 'Willis'
    });

    anotherUser = new UserSchema({
      _id: anotherUserId,
      firstname: 'Chuck',
      username: 'cnorris',
      lastname: 'Norris'
    });

    Q.all([user.save(), anotherUser.save()]).then(() => {
      done();
    }, done);
  });

  beforeEach(function(done) {
    app.lib.start(function(err) {
      done(err);
    });
  });

  afterEach(function(done) {
    async.parallel([this.helpers.mongo.dropDatabase, this.helpers.resetRedis], done);
  });

  describe('on message creation', function() {
    it('should index in elasticsearch', function(done) {
      const self = this;
      const message = {
        text: 'This is the message content',
        type: 'text'
      };
      const message2 = {
        text: 'This is the message2 content',
        type: 'text'
      };

      Q.all([
        Q.nfapply(app.lib.message.create, [message]),
        Q.nfapply(app.lib.message.create, [message2])
      ]).then(test, done);

      function checkMessagesIndexed(messages) {
        const options = {
          index: CONSTANTS.SEARCH.MESSAGES.INDEX_NAME,
          type: CONSTANTS.SEARCH.MESSAGES.TYPE_NAME,
          ids: messages.map(message => message._id)
        };

        return Q.nfapply(self.helpers.elasticsearch.checkDocumentsIndexed, [options]);
      }

      function test(created) {
        checkMessagesIndexed(created).then(function() {
          done();
        }, done);
      }
    });
  });

  describe('GET /api/messages?search=', function() {
    it('should return messages from public conversations where current user is member', function(done) {
      const self = this;
      const search = 'searchme';

      const publicChannel1 = {
        name: 'A public channel',
        type: CONVERSATION_TYPE.OPEN,
        members: [userAsMember]
      };

      const publicChannel2 = {
        name: 'Another public channel',
        type: CONVERSATION_TYPE.OPEN,
        members: [asMember(anotherUserId)]
      };

      const privateChannel1 = {
        name: 'A private channel I am member of',
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [userAsMember, asMember(anotherUserId)]
      };

      const privateChannel2 = {
        name: 'A private channel I am not member of',
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [asMember(anotherUserId)]
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
        Q.nfapply(app.lib.conversation.create, [publicChannel1]),
        Q.nfapply(app.lib.conversation.create, [publicChannel2]),
        Q.nfapply(app.lib.conversation.create, [privateChannel1]),
        Q.nfapply(app.lib.conversation.create, [privateChannel2])
      ], (channel1, channel2, channel3, channel4) => {

        message.channel = channel1._id;
        message2.channel = channel2._id;
        message3.channel = channel4._id;
        message4.channel = channel3._id;
        message5.channel = channel1._id;
        message6.channel = channel3._id;

        return Q.all([
          Q.nfapply(app.lib.message.create, [message]),
          Q.nfapply(app.lib.message.create, [message2]),
          Q.nfapply(app.lib.message.create, [message3]),
          Q.nfapply(app.lib.message.create, [message4]),
          Q.nfapply(app.lib.message.create, [message5]),
          Q.nfapply(app.lib.message.create, [message6])
        ]);

      }).then(waitForMessagesToBeIndexed)
      .then(test)
      .catch(done);

    function test() {
      request(app.express)
        .get(`/api/messages?search=${search}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.headers['x-esn-items-count']).to.equal('2');
          expect(_.find(res.body, { text: message.text, isStarred: true })).to.exist;
          expect(_.find(res.body, { text: message6.text, isStarred: false })).to.exist;
          expect(res.body[0].channel).to.be.an('object');
          expect(res.body[1].channel).to.be.an('object');
          done();
        });
      }

      function waitForMessagesToBeIndexed(messages) {
        const options = {
          index: CONSTANTS.SEARCH.MESSAGES.INDEX_NAME,
          type: CONSTANTS.SEARCH.MESSAGES.TYPE_NAME,
          ids: messages.map(message => message._id)
        };

        starredMessage._id = messages[0]._id;

        return Q.nfapply(self.helpers.elasticsearch.checkDocumentsIndexed, [options]);
      }
    });
  });

  describe('on conversation creation', function() {
    it('should index in elasticsearch', function(done) {
      const self = this;
      const conversation = {
        name: 'Test Channel 1',
        purpose: {
          value: 'This is a test channel'
        },
        type: CONVERSATION_TYPE.OPEN
      };
      const conversation2 = {
        name: 'Test Channel 2',
        purpose: {
          value: 'This is also a test channel'
        },
        type: CONVERSATION_TYPE.OPEN
      };

      Q.all([
        Q.nfapply(app.lib.conversation.create, [conversation]),
        Q.nfapply(app.lib.conversation.create, [conversation2])
      ]).then(test, done);

      function checkConversationsIndexed(conversations) {
        const options = {
          index: CONSTANTS.SEARCH.CONVERSATIONS.INDEX_NAME,
          type: CONSTANTS.SEARCH.CONVERSATIONS.TYPE_NAME,
          ids: conversations.map(conversation => conversation._id)
        };

        return Q.nfapply(self.helpers.elasticsearch.checkDocumentsIndexed, [options]);
      }

      function test(created) {
        checkConversationsIndexed(created).then(function() {
          done();
        }, done);
      }
    });
  });

  describe('GET /api/conversations?search=', function() {
    it('should return all public conversations even channels which user is not a member of', function(done) {
      const self = this;
      const search = 'searchme';

      const publicChannel1 = {
        name: 'First public channel: searchme',
        type: CONVERSATION_TYPE.OPEN,
        members: [userAsMember]
      };

      const publicChannel2 = {
        name: 'Second public channel',
        topic: {
          value: 'This channel topic is relevant: searchme'
        },
        type: CONVERSATION_TYPE.OPEN,
        members: [asMember(anotherUserId)]
      };

      const publicChannel3 = {
        name: 'Third public channel',
        purpose: {
          value: 'This channel purpose is relevant: searchme'
        },
        type: CONVERSATION_TYPE.OPEN,
        members: [asMember(anotherUserId), userAsMember]
      };

      const privateChannel1 = {
        name: 'A private channel: searchme',
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [asMember(anotherUserId), userAsMember]
      };

      const privateChannel2 = {
        name: 'This private channel does not belong to current user: searchme',
        type: CONVERSATION_TYPE.CONFIDENTIAL,
        members: [asMember(anotherUserId)]
      };

      Q.all([
          Q.nfapply(app.lib.conversation.create, [publicChannel1]),
          Q.nfapply(app.lib.conversation.create, [publicChannel2]),
          Q.nfapply(app.lib.conversation.create, [publicChannel3]),
          Q.nfapply(app.lib.conversation.create, [privateChannel1]),
          Q.nfapply(app.lib.conversation.create, [privateChannel2])
        ]).then(waitForConversationsToBeIndexed)
      .then(test)
      .catch(done);

    function test() {
      request(app.express)
        .get(`/api/conversations?search=${search}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          const results = res.body.map(result => result.name);

          if (err) {
            return done(err);
          }

          expect(res.headers['x-esn-items-count']).to.equal('4');
          expect(results).to.include(publicChannel1.name);
          expect(results).to.include(publicChannel2.name);
          expect(results).to.include(publicChannel3.name);
          expect(results).to.include(privateChannel1.name);
          expect(results).to.not.include(privateChannel2.name);
          done();
        });
      }

      function waitForConversationsToBeIndexed(conversations) {
        const options = {
          index: CONSTANTS.SEARCH.CONVERSATIONS.INDEX_NAME,
          type: CONSTANTS.SEARCH.CONVERSATIONS.TYPE_NAME,
          ids: conversations.map(conversation => conversation._id)
        };

        return Q.nfapply(self.helpers.elasticsearch.checkDocumentsIndexed, [options]);
      }
    });
  });
});
