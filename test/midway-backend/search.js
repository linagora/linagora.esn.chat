'use strict';

const _ = require('lodash');
const Q = require('q');
const mockery = require('mockery');
const async = require('async');
const CONSTANTS = require('../../backend/lib/constants');
const logger = require('../fixtures/logger');

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
      let self = this;
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
        Q.nfapply(app.lib.message.create, [message2]),
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

});
