'use strict';

const Q = require('q');
const _ = require('lodash');
const async = require('async');
const sinon = require('sinon');
const expect = require('chai').expect;
const mockery = require('mockery');
const Emitter = require('events').EventEmitter;
const WSClient = require('esn-chat-client').WebsocketClient;
const CONSTANTS = require('../../backend/lib/constants');

describe('The websocket API', function() {
  let app, mongoose, userId, userAsMember, pubsub, deps, collaborations, collaboration, writable, readable, wsserver;
  let defaultChannel, confidentialConversation;
  let userA, userB, userC;
  let clientA, clientB, clientC;

  function dependencies(name) {
    return deps[name];
  }

  beforeEach(function() {
    // https://github.com/mfncooper/mockery/issues/34
    mockery.registerMock('ursa', {});
    mockery.registerMock('canvas', {});
    mockery.registerMock('../../core/ldap', {});
  });

  beforeEach(function(done) {
    const self = this;

    mongoose = require('linagora-rse/backend/core/db/mongo').mongoose;
    mongoose.connect(self.testEnv.mongoUrl);

    const PubSub = require('linagora-rse/backend/core/pubsub/pubsub');
    const pubsubGlobal = new PubSub('global', new Emitter());
    const corePubsub = require('linagora-rse/backend/core/pubsub');

    corePubsub.global = pubsubGlobal;
    pubsub = {local: corePubsub.local, global: pubsubGlobal};
    done();
  });

  beforeEach(function() {
    collaborations = [];
    collaboration = {};
    writable = true;
    readable = true;

    mockery.registerMock('../../core/auth/token', {
      getToken: function(token, callback) {
        // send userId as token to be able to validate auth on OP.
        callback(null, {user: token});
      }
    });

    wsserver = require('linagora-rse/backend/wsserver').wsserver;

    deps = {
      logger: require('../fixtures/logger'),
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
          countMembers: function(objectType, id, callback) {
            callback(null, 0);
          }
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

              return new mongoose.Schema(definition);
            }
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
      },
      i18n: this.helpers.i18n
    };
  });

  beforeEach(function(done) {
    wsserver.start(this.testEnv.serversConfig.express.port, {}, function(err) {
      if (err) {
        return done(err);
      }

      deps.wsserver = {
        // io is initialized on start, so need to define dependency after...
        io: wsserver.io,
        ioHelper: require('linagora-rse/backend/wsserver/helper/socketio')
      };

      done();
    });
  });

  beforeEach(function(done) {
    const self = this;

    Q.all([
      saveUser('bruce', 'willis'),
      saveUser('chuck', 'norris'),
      saveUser('clint', 'eastwood')
    ]).spread((bruce, chuck, clint) => {
      userA = bruce;
      userB = chuck;
      userC = clint;
      userId = userA._id;
      userAsMember = self.helpers.asMember(userId);
      done();
    }, done);
  });

  beforeEach(function() {
    app = this.helpers.loadApplication(dependencies, true);
  });

  beforeEach(function(done) {
    app.ws.init(dependencies, app.lib);
    app.lib.start(done);
  });

  beforeEach(function(done) {
    const self = this;

    Q.all([
      Q.denodeify(app.lib.conversation.createDefaultChannel)({}),
      Q.denodeify(app.lib.conversation.create)({
        type: CONSTANTS.CONVERSATION_TYPE.CONFIDENTIAL,
        members: [self.helpers.asMember(userA), self.helpers.asMember(userB)]
      })
    ]).spread((general, confidential) => {
      defaultChannel = general;
      confidentialConversation = confidential;
      done();
    }, done);
  });

  beforeEach(function() {
    this.getClient = function(user) {
      return new WSClient({
        url: `http://${this.testEnv.serversConfig.host}:${this.testEnv.serversConfig.express.port}`,
        token: String(user._id || user),
        userId: String(user._id || user)
      });
    };
  });

  beforeEach(function() {
    clientA = this.getClient(userA);
    clientB = this.getClient(userB);
    clientC = this.getClient(userC);
  });

  afterEach(function() {
    clientA = null;
    clientB = null;
    clientC = null;

    wsserver.cleanAllWebsockets();

    if (wsserver.io) {
      wsserver.io.close();
    }

    if (wsserver.server) {
      wsserver.server.close();
    }
  });

  afterEach(function(done) {
    async.parallel([this.helpers.mongo.dropDatabase, this.helpers.resetRedis], done);
  });

  function saveUser(firstname, lastname) {
    const User = mongoose.model('User');
    const user = new User({
      firstname: firstname,
      lastname: lastname,
      password: 'secret',
      accounts: [{
        type: 'email',
        emails: [`${firstname}.${lastname}@open-paas.org`]
      }]
    });

    return user.save();
  }

  function getTextMessage(text, conversation, user) {
    return {
      type: CONSTANTS.MESSAGE_TYPE.TEXT,
      text: text,
      channel: String(conversation._id || conversation),
      creator: String(user._id || user)
    };
  }

  function getUserTypingMessage(conversation, user) {
    return {
      type: CONSTANTS.MESSAGE_TYPE.USER_TYPING,
      channel: String(conversation._id || conversation),
      creator: String(user._id || user),
      state: true
    };
  }

  function waitToBeConnected(clients) {
    const promises = [];

    clients.forEach(client => {
      const connectedDefer = Q.defer();

      promises.push(connectedDefer.promise);
      client.on('hello', () => {
        connectedDefer.resolve();
      });

      client.connect();
    });

    return Q.all(promises);
  }

  it('should be able to connect to the chat namespace', function(done) {
    waitToBeConnected([clientA]).then(function() {
      done();
    }, done);
  });

  describe('When the client is sending a message to the server', function() {
    it('should be published in the local pubsub', function(done) {
      const message = getTextMessage('hello', defaultChannel, userA);

      pubsub.local.topic(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED).subscribe(data => {
        expect(data.message).to.shallowDeepEqual(message);
        done();
      });

      waitToBeConnected([clientA])
        .then(() => clientA.send('message', message))
        .catch(done);
    });

    describe('When user is typing a message', function() {
      it('should not be saved in database', function(done) {
        const message = getUserTypingMessage(defaultChannel, userA);
        const userTypingReceivedDeferA = Q.defer();
        const userTypingReceivedDeferB = Q.defer();

        clientA.on('message', message => {
          userTypingReceivedDeferA.resolve(message);
        });

        clientB.on('message', message => {
          userTypingReceivedDeferB.resolve(message);
        });

        waitToBeConnected([clientA, clientB])
          .then(() => clientA.send('message', message))
          .then(() => Q.all([userTypingReceivedDeferA.promise, userTypingReceivedDeferB.promise]))
          .then(checkNoMessages)
          .catch(done);

        function checkNoMessages() {
          return Q.denodeify(app.lib.message.count)(defaultChannel._id).then(count => {
            expect(count).to.equal(0);
            done();
          });
        }
      });

      describe('On open conversation', function() {
        it('should be forwarded to all members even current one', function(done) {
          const message = getUserTypingMessage(defaultChannel, userA);
          const userTypingReceivedDeferA = Q.defer();
          const userTypingReceivedDeferB = Q.defer();

          clientA.on('message', message => {
            userTypingReceivedDeferA.resolve(message);
          });

          clientB.on('message', message => {
            userTypingReceivedDeferB.resolve(message);
          });

          waitToBeConnected([clientA, clientB])
            .then(() => clientA.send('message', message))
            .then(() => Q.all([userTypingReceivedDeferA.promise, userTypingReceivedDeferB.promise]))
            .spread((messageOnClientA, messageOnClientB) => {
              expect(messageOnClientA.type).to.equal(CONSTANTS.MESSAGE_TYPE.USER_TYPING);
              expect(messageOnClientB.type).to.equal(CONSTANTS.MESSAGE_TYPE.USER_TYPING);
              done();
            })
            .catch(done);
        });

        it('should be forwarded to all members even current one on all its websocket connections', function(done) {
          const message = getUserTypingMessage(defaultChannel, userA);
          const userTypingReceivedDeferA = Q.defer();
          const userTypingReceivedDeferAA = Q.defer();
          const userTypingReceivedDeferB = Q.defer();
          const clientAA = this.getClient(userA);

          clientA.on('message', message => {
            userTypingReceivedDeferA.resolve(message);
          });

          clientAA.on('message', message => {
            userTypingReceivedDeferAA.resolve(message);
          });

          clientB.on('message', message => {
            userTypingReceivedDeferB.resolve(message);
          });

          waitToBeConnected([clientA, clientAA, clientB])
            .then(() => clientA.send('message', message))
            .then(() => Q.all([userTypingReceivedDeferA.promise, userTypingReceivedDeferAA.promise, userTypingReceivedDeferB.promise]))
            .spread((messageOnClientA, messageOnClientAA, messageOnClientB) => {
              expect(messageOnClientA.type).to.equal(CONSTANTS.MESSAGE_TYPE.USER_TYPING);
              expect(messageOnClientAA.type).to.equal(CONSTANTS.MESSAGE_TYPE.USER_TYPING);
              expect(messageOnClientB.type).to.equal(CONSTANTS.MESSAGE_TYPE.USER_TYPING);
              done();
            })
            .catch(done);
        });
      });

      describe('On confidential conversation', function() {
        it('should be forwarded only to conversation members', function(done) {
          const message = getUserTypingMessage(confidentialConversation, userA);
          const userTypingReceivedDeferA = Q.defer();
          const userTypingReceivedDeferB = Q.defer();
          const userTypingReceivedSpyC = sinon.spy();

          clientA.on('message', message => {
            userTypingReceivedDeferA.resolve(message);
          });

          clientB.on('message', message => {
            userTypingReceivedDeferB.resolve(message);
          });

          clientC.on('message', () => {
            userTypingReceivedSpyC();
            done(new Error('Should not be called'));
          });

          waitToBeConnected([clientA, clientB, clientC])
            .then(() => clientA.send('message', message))
            .then(() => Q.all([userTypingReceivedDeferA.promise, userTypingReceivedDeferB.promise]))
            .spread((messageOnClientA, messageOnClientB) => {
              expect(messageOnClientA.type).to.equal(CONSTANTS.MESSAGE_TYPE.USER_TYPING);
              expect(messageOnClientB.type).to.equal(CONSTANTS.MESSAGE_TYPE.USER_TYPING);
              setTimeout(function() {
                expect(userTypingReceivedSpyC).to.not.have.been.called;
                done();
              }, 3000);
            })
            .catch(done);
        });
      });
    });

    describe('When user is sending a text message', function() {
      describe('on open conversation', function() {
        it('should be saved in database', function(done) {
          const message = getTextMessage('hello', defaultChannel, userA);
          const userReceivedDeferA = Q.defer();

          clientA.on('message', message => {
            userReceivedDeferA.resolve(message);
          });

          waitToBeConnected([clientA])
            .then(() => clientA.send('message', message))
            .then(() => userReceivedDeferA.promise)
            .then(checkMessageSaved)
            .catch(done);

            function checkMessageSaved() {
              return Q.denodeify(app.lib.message.count)(defaultChannel._id).then(count => {
                expect(count).to.equal(1);
                done();
              });
            }
        });

        it('should be forwarded to all users', function(done) {
          const message = getTextMessage('hello', defaultChannel, userA);
          const userReceivedDeferA = Q.defer();
          const userReceivedDeferB = Q.defer();

          clientA.on('message', message => {
            userReceivedDeferA.resolve(message);
          });

          clientB.on('message', message => {
            userReceivedDeferB.resolve(message);
          });

          waitToBeConnected([clientA, clientB])
            .then(() => clientA.send('message', message))
            .then(() => Q.all([userReceivedDeferA.promise, userReceivedDeferB.promise]))
            .spread((messageOnClientA, messageOnClientB) => {
              expect(messageOnClientA).to.shallowDeepEqual({text: message.text, type: message.type});
              expect(messageOnClientB).to.shallowDeepEqual({text: message.text, type: message.type});
              done();
            })
            .catch(function(err) {
              done(err);
            });
        });
      });

      describe('on confidential conversation', function() {
        it('should be forwarded only to conversation members', function(done) {
          const message = getTextMessage('hello', confidentialConversation, userA);
          const textReceivedDeferA = Q.defer();
          const textReceivedDeferB = Q.defer();
          const textReceivedSpyC = sinon.spy();

          clientA.on('message', message => {
            textReceivedDeferA.resolve(message);
          });

          clientB.on('message', message => {
            textReceivedDeferB.resolve(message);
          });

          clientC.on('message', () => {
            textReceivedSpyC();
            done(new Error('Should not be called'));
          });

          waitToBeConnected([clientA, clientB, clientC])
            .then(() => clientA.send('message', message))
            .then(() => Q.all([textReceivedDeferA.promise, textReceivedDeferB.promise]))
            .spread((messageOnClientA, messageOnClientB) => {
              expect(messageOnClientA).to.shallowDeepEqual({type: CONSTANTS.MESSAGE_TYPE.TEXT, text: message.text});
              expect(messageOnClientB).to.shallowDeepEqual({type: CONSTANTS.MESSAGE_TYPE.TEXT, text: message.text});
              setTimeout(() => {
                expect(textReceivedSpyC).to.not.have.been.called;
                done();
              }, 3000);
            })
            .catch(done);
        });
      });
    });

    describe.skip('When user is mentioning someone', function() {
      describe('on open conversation', function() {
      });

      describe('on confidential conversation', function() {
      });
    });

    describe.skip('When this is the first message of a conversation', function() {
      describe('on open conversation', function() {
      });

      describe('on confidential conversation', function() {
      });
    });
  });

  describe.skip('When a member joins conversation', function() {
    describe('on open conversation', function() {
    });

    describe('on confidential conversation', function() {
    });
  });

  describe.skip('When a member leaves a conversation', function() {
    describe('on open conversation', function() {
    });

    describe('on confidential conversation', function() {
    });
  });

  describe.skip('When a conversation is created', function() {
    describe('on open conversation', function() {
    });

    describe('on confidential conversation', function() {
    });
  });

  describe.skip('When a conversation is removed', function() {
    describe('on open conversation', function() {
    });

    describe('on confidential conversation', function() {
    });
  });

  describe.skip('When a conversation topic is updated', function() {
    describe('on open conversation', function() {
    });

    describe('on confidential conversation', function() {
    });
  });
});
