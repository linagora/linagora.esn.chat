'use strict';

const Q = require('q');
const path = require('path');
const sinon = require('sinon');
const request = require('supertest');
const expect = require('chai').expect;
const WSClient = require('@linagora/esn-chat-client').WebsocketClient;
const CONSTANTS = require('../../backend/lib/constants');

describe('The websocket API', function() {
  let defaultChannel, directMesssageConversation;
  let userA, userB, userC;
  let app, lib, deps, helpers;
  let serversConfig;
  const password = 'secret';

  beforeEach(function(done) {
    const self = this;

    helpers = this.helpers;
    serversConfig = this.testEnv.serversConfig;
    lib = self.helpers.modules.current.lib.lib;
    app = self.helpers.modules.current.app;
    deps = self.helpers.modules.current.deps;

    const deployOptions = {
      fixtures: path.normalize(`${__dirname}/fixtures/deployments`)
    };

    helpers.api.applyDomainDeployment('chatModule', deployOptions, helpers.callbacks.noErrorAnd(models => {
      userA = models.users[0];
      userB = models.users[1];
      userC = models.users[2];

      done();
    }));
  });

  const generateMemberFromUser = user => ({
    member: {
      id: String(user._id || user),
      objectType: 'user'
    }
  });

  beforeEach(function(done) {
    Q.all([
      Q.denodeify(lib.conversation.createDefaultChannel)({}),
      Q.denodeify(lib.conversation.create)({
        type: CONSTANTS.CONVERSATION_TYPE.DIRECT_MESSAGE,
        members: [generateMemberFromUser(userA), generateMemberFromUser(userB)]
      })
    ]).spread((general, directConversation) => {
      defaultChannel = general;
      directMesssageConversation = directConversation;
      done();
    }, done);
  });

  afterEach(function() {
    deps('wsserver').cleanAllWebsockets();
  });

  const getClient = (user, callback) => {
    helpers.api.loginAsUser(app, user.emails[0], password, (err, requestAsMember) => {
      if (err) {
        return callback(err);
      }

      const req = requestAsMember(request(app).get('/api/authenticationtoken'));

      req.expect(200);
      req.end((err, res) => {
        if (err) {
          return callback(err);
        }

        callback(null, new WSClient({
          url: `http://${serversConfig.host}:${serversConfig.express.port}`,
          token: res.body.token,
          userId: res.body.user
        }));
      });
    });
  };

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
    getClient(userA, helpers.callbacks.noErrorAnd(client => {
      waitToBeConnected([client]).then(function() {
        done();
      });
    }));
  });

  describe('When the client is sending a message to the server', function() {
    describe('When user is typing a message', function() {
      it('should not be saved in database', function(done) {
        const message = getUserTypingMessage(directMesssageConversation, userA);
        const userTypingReceivedDeferA = Q.defer();
        const userTypingReceivedDeferB = Q.defer();

        Q.all([
          Q.denodeify(getClient)(userA),
          Q.denodeify(getClient)(userB)
        ]).spread((clientA, clientB) => {
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
            return Q.denodeify(lib.message.count)(defaultChannel._id).then(count => {
              expect(count).to.equal(0);
              done();
            });
          }
        });
      });

      describe('On open conversation', function() {
        it('should be forwarded to all members even current one', function(done) {
          const message = getUserTypingMessage(defaultChannel, userA);
          const userTypingReceivedDeferA = Q.defer();
          const userTypingReceivedDeferB = Q.defer();

          Q.all([
            Q.denodeify(getClient)(userA),
            Q.denodeify(getClient)(userB)
          ]).spread((clientA, clientB) => {
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
        });

        it('should be forwarded to all members even current one on all its websocket connections', function(done) {
          const message = getUserTypingMessage(defaultChannel, userA);
          const userTypingReceivedDeferA = Q.defer();
          const userTypingReceivedDeferAA = Q.defer();
          const userTypingReceivedDeferB = Q.defer();

          Q.all([
            Q.denodeify(getClient)(userA),
            Q.denodeify(getClient)(userA),
            Q.denodeify(getClient)(userB)
          ]).spread((clientA, clientAA, clientB) => {
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
      });

      describe('On private conversation', function() {
        it('should be forwarded only to conversation members', function(done) {
          const message = getUserTypingMessage(directMesssageConversation, userA);
          const userTypingReceivedDeferA = Q.defer();
          const userTypingReceivedDeferB = Q.defer();
          const userTypingReceivedSpyC = sinon.spy();

          Q.all([
            Q.denodeify(getClient)(userA),
            Q.denodeify(getClient)(userB),
            Q.denodeify(getClient)(userC)
          ]).spread((clientA, clientB, clientC) => {
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
                }, 1000);
              })
              .catch(done);
          });
        });
      });
    });

    describe('When user is sending a text message', function() {
      describe('on open conversation', function() {
        it('should be saved in database', function(done) {
          const message = getTextMessage('hello', defaultChannel, userA);
          const userReceivedDeferA = Q.defer();

          Q.denodeify(getClient)(userA).then(clientA => {
            clientA.on('message', message => {
              userReceivedDeferA.resolve(message);
            });

            waitToBeConnected([clientA])
              .then(() => clientA.send('message', message))
              .then(() => userReceivedDeferA.promise)
              .then(checkMessageSaved)
              .catch(done);

              function checkMessageSaved() {
                Q.denodeify(lib.message.count)(defaultChannel._id).then(count => {
                  expect(count).to.equal(1);
                  done();
                });
              }
          });
        });

        it('should be forwarded to all users', function(done) {
          const message = getTextMessage('hello', defaultChannel, userA);
          const userReceivedDeferA = Q.defer();
          const userReceivedDeferB = Q.defer();

          Q.all([
            Q.denodeify(getClient)(userA),
            Q.denodeify(getClient)(userB)
          ]).spread((clientA, clientB) => {
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
      });

      describe('on private conversation', function() {
        it('should be forwarded only to conversation members', function(done) {
          const message = getTextMessage('hello', directMesssageConversation, userA);
          const textReceivedDeferA = Q.defer();
          const textReceivedDeferB = Q.defer();
          const textReceivedSpyC = sinon.spy();

          Q.all([
            Q.denodeify(getClient)(userA),
            Q.denodeify(getClient)(userB),
            Q.denodeify(getClient)(userC)
          ]).spread((clientA, clientB, clientC) => {
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
                }, 1000);
              })
              .catch(done);
          });
        });
      });
    });

    describe('When user is mentioning someone', function() {
      it('should increase number of unseen mentions of mentioned members', function(done) {
        Q.ninvoke(lib.conversation, 'create', {
          type: CONSTANTS.CONVERSATION_TYPE.OPEN,
          members: [generateMemberFromUser(userA), generateMemberFromUser(userB)]
        }).then(conversation => {
          const message = getTextMessage(`Hello @${String(userB._id)}`, conversation, userA);

          Q.denodeify(getClient)(userA).then(clientA => {
            waitToBeConnected([clientA])
              .then(() => clientA.send('message', message))
              .then(checkMessageSaved)
              .catch(done);

              function checkMessageSaved() {
                setTimeout(() => {
                  Q.denodeify(lib.conversation.getById)(conversation._id).then(modifiedConversation => {
                    expect(modifiedConversation.memberStates[String(userB._id)].numOfUnseenMentions).to.equal(1);
                    done();
                  });
                }, 1000);
              }
          });
        });
      });
    });
  });
});
