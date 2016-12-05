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

  let deps, mongoose, userId, user, anotherUserId, anotherUser, app;

  function dependencies(name) {
    return deps[name];
  }

  beforeEach(function(done) {
    const self = this;

    mongoose = require('mongoose');
    mongoose.Promise = Q.Promise;
    mongoose.connect(this.testEnv.mongoUrl);
    userId = mongoose.Types.ObjectId();
    anotherUserId = mongoose.Types.ObjectId();

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

    deps = {
      logger: logger,
      user: {
        moderation: {registerHandler: _.constant()},
        get: function(id, callback) {
          mongoose.model('User').findOne({_id: id}, callback);
        }
      },
      collaboration: {
        getCollaborationsForUser: function(user, options, callback) {
          callback(null, []);
        },
        queryOne: function(tuple, query, callback) {
          callback(null, {});
        },
        permission: {
          canWrite: function(collaboration, tuple, callback) {
            callback(null, true);
          }
        }
      },
      elasticsearch: elasticsearch,
      pubsub: {
        local: localPubsub,
        global: localPubsub
      },
      db: {
        mongo: {
          mongoose: mongoose
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
        type: CONVERSATION_TYPE.CHANNEL,
        members: [userId]
      };

      const publicChannel2 = {
        name: 'Another public channel',
        type: CONVERSATION_TYPE.CHANNEL,
        members: [anotherUserId]
      };

      const privateChannel1 = {
        name: 'A private channel I am member of',
        type: CONVERSATION_TYPE.PRIVATE,
        members: [userId, anotherUserId]
      };

      const privateChannel2 = {
        name: 'A private channel I am not member of',
        type: CONVERSATION_TYPE.PRIVATE,
        members: [anotherUserId]
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
          expect((res.body[0].text === message.text && res.body[1].text === message6.text) || (res.body[0].text === message6.text && res.body[1].text === message.text)).to.be.true;
          done();
        });
      }

      function waitForMessagesToBeIndexed(messages) {
        const options = {
          index: CONSTANTS.SEARCH.MESSAGES.INDEX_NAME,
          type: CONSTANTS.SEARCH.MESSAGES.TYPE_NAME,
          ids: messages.map(message => message._id)
        };

        return Q.nfapply(self.helpers.elasticsearch.checkDocumentsIndexed, [options]);
      }
    });

    it('should return messages from collaboration conversations where current user is member', function(done) {
      const self = this;
      const collaboration = {
        objectType: 'community',
        _id: mongoose.Types.ObjectId()
      };
      const search = 'searchme';

      deps.collaboration.getCollaborationsForUser = function(user, options, callback) {
        callback(null, [collaboration]);
      };

      const publicChannel = {
        name: 'A public channel',
        type: CONVERSATION_TYPE.CHANNEL,
        members: []
      };

      const collaborationChannel = {
        name: 'A collaboration channel',
        type: CONVERSATION_TYPE.COLLABORATION,
        collaboration: {
          objectType: collaboration.objectType,
          id: String(collaboration._id)
        }
      };

      const message = {
        text: 'This is the message in public channel I am not member: searchme',
        type: 'text'
      };

      const message2 = {
        text: 'This is the message in collaboration channel I am member: searchme',
        type: 'text'
      };

      const message3 = {
        text: 'This is another message in collaboration channel where term is not present',
        type: 'text'
      };

      Q.spread([
        Q.nfapply(app.lib.conversation.create, [publicChannel]),
        Q.nfapply(app.lib.conversation.create, [collaborationChannel])
      ], (publicChan, collaborationChan) => {

        message.channel = publicChan._id;
        message2.channel = collaborationChan._id;
        message3.channel = collaborationChan._id;

        return Q.all([
          Q.nfapply(app.lib.message.create, [message]),
          Q.nfapply(app.lib.message.create, [message2]),
          Q.nfapply(app.lib.message.create, [message3])
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
          expect(res.headers['x-esn-items-count']).to.equal('1');
          expect(res.body).to.shallowDeepEqual([{text: message2.text}]);
          done();
        });
      }

      function waitForMessagesToBeIndexed(messages) {
        const options = {
          index: CONSTANTS.SEARCH.MESSAGES.INDEX_NAME,
          type: CONSTANTS.SEARCH.MESSAGES.TYPE_NAME,
          ids: messages.map(message => message._id)
        };

        return Q.nfapply(self.helpers.elasticsearch.checkDocumentsIndexed, [options]);
      }
    });
  });
});
