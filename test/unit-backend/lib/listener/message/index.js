'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var mockery = require('mockery');
var _ = require('lodash');
var Q = require('Q');
var CONSTANTS = require('../../../../../backend/lib/constants');

describe('The linagora.esn.chat lib message listener module', function() {

  var deps, err, user, messageReceivedListener, globalPublish, ChatMessageMock, dependencies, logger, communityCreatedListener, memberAddedListener, comunityUpdateListener;

  beforeEach(function() {
    dependencies = function(name) {
      return deps[name];
    };

    err = null;
    user = null;

    ChatMessageMock = sinon.spy(function() {
      this.populate = ChatMessageMock.populate;
    });

    logger = {
      error: console.log,
      info: console.log,
      debug: console.log,
      warn: console.log
    };

    ChatMessageMock.populate = sinon.spy(_.identity);

    globalPublish = sinon.spy();
    deps = {
      logger: logger,
      db: {
        mongo: {
          mongoose: {
            model: sinon.spy(function(name) {
              if (name === 'ChatMessage') {
                return ChatMessageMock;
              }
            })
          }
        }
      },
      pubsub: {
        local: {
          topic: function(topic) {
            return {
              subscribe: function(cb) {
                if (topic === CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED) {
                  messageReceivedListener = cb;
                } else if (topic === CONSTANTS.NOTIFICATIONS.COMMUNITY_CREATED) {
                  communityCreatedListener = cb;
                } else if (topic === CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_COMMUNITY) {
                  memberAddedListener = cb;
                } else if (topic === CONSTANTS.NOTIFICATIONS.COMMUNITY_UPDATE) {
                  comunityUpdateListener = cb;
                }
              }
            };
          }
        },
        global: {
          topic: sinon.spy(function() {
            return {
              publish: globalPublish
            };
          })
        }
      },
      user: {
        get: sinon.spy(function(id, callback) {
          callback(err, user);
        })
      }
    };
  });

  describe('The start function', function() {
    beforeEach(function() {
      mockery.registerMock('./handlers/first', function() {
        return function() {};
      });
      mockery.registerMock('./handlers/mentions', function() {
        return function() {};
      });
      mockery.registerMock('./forward/user-typing', function() {
        return function() {};
      });
    });

    it('should not save when message is forwardable', function(done) {
      const type = 'forwardable_type';
      const data = {
        message: {
          type: type
        },
        room: 'room'
      };
      const channel = {
        createMessage: function() {
          return done(new Error());
        }
      };
      const handler = function(message) {
        expect(message).to.deep.equals(data.message);
        done();
      };
      const module = require('../../../../../backend/lib/listener/message')(dependencies);

      module.addForwardHandler(type, handler);
      module.start(channel);
      messageReceivedListener(data);
    });

    describe('When message is not forwardable', function() {
      const type = 'text';
      const text = 'yolo';
      const date = '0405';
      const creator = '1';
      const conversation = 'general';
      const attachments = [1, 2, 3];
      const room = 'room';
      let data;

      beforeEach(function() {
        data = {
          message: {
            type: type,
            text: text,
            date: date,
            creator: creator,
            channel: conversation,
            attachments: attachments
          },
          room: room
        };
      });

      it('should save the message and broadcast the saved message to globalpubsub if user can write in conversation', function(done) {
        user = {_id: 1};
        const createMessageResult = 'createMessageResult';
        const conversationMock = {
          getById: sinon.spy(function(id, callback) {
            return callback(null, {members: [{_id: creator}]});
          }),
          permission: {
            userCanWrite: function(user, conversation) {
              return Q.when(true);
            }
          }
        };
        const messageMock = {
          create: sinon.spy(function(_m, callback) {
            callback(null, createMessageResult);
          })
        };
        const module = require('../../../../../backend/lib/listener/message')(dependencies);

        module.start({conversation: conversationMock, message: messageMock});

        globalPublish = function(data) {
          expect(messageMock.create).to.have.been.calledWith({
            type: type,
            text: text,
            date: date,
            creator: creator,
            channel: conversation,
            attachments: attachments
          });

          expect(deps.pubsub.global.topic).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED);
          expect(data).to.be.deep.equals({room: data.room, message: createMessageResult});
          expect(conversationMock.getById).to.have.been.calledWith(conversation);
          done();
        };

        messageReceivedListener(data);
      });

      it('should not save the message if user is not allowed to write to conversation', function(done) {
        user = {_id: 1};
        globalPublish = sinon.spy();
        const createMessageResult = 'createMessageResult';
        const messageMock = {
          create: sinon.spy(function(_m, callback) {
            callback(null, createMessageResult);
          })
        };
        const conversationMock = {
          getById: sinon.spy(function(id, callback) {
            expect(id).to.be.equal(conversation);
            callback(null, {members: [{_id: 'id'}], type: 'channel'});
          }),
          permission: {
            userCanWrite: function() {
              return Q.when(false);
            }
          }
        };
        const module = require('../../../../../backend/lib/listener/message')(dependencies);

        module.start({conversation: conversationMock, message: messageMock});

        messageReceivedListener(data).then(done, function(err) {
          expect(globalPublish).to.not.have.been.called;
          expect(messageMock.create).to.not.have.been.called;
          expect(err.message).to.match(/can not write message in the conversation/);
          done();
        });
      });

      it('should not save the message when conversation is not found', function(done) {
        user = {_id: 1};
        globalPublish = sinon.spy();
        const createMessageResult = 'createMessageResult';
        const messageMock = {
          create: sinon.spy(function(_m, callback) {
            callback(null, createMessageResult);
          })
        };
        const conversationMock = {
          getById: sinon.spy(function(id, callback) {
            expect(id).to.be.equal(conversation);
            callback();
          }),
          permission: {
            userCanWrite: function() {
              return Q.when(false);
            }
          }
        };
        const module = require('../../../../../backend/lib/listener/message')(dependencies);

        module.start({conversation: conversationMock, message: messageMock});

        messageReceivedListener(data).then(done, function(err) {
          expect(globalPublish).to.not.have.been.called;
          expect(messageMock.create).to.not.have.been.called;
          expect(err.message).to.match(/No such conversation/);
          done();
        });
      });

      it('should not save the message when conversation.getById fails', function(done) {
        user = {_id: 1};
        globalPublish = sinon.spy();
        const msg = 'conversation.getById failed';
        const createMessageResult = 'createMessageResult';
        const messageMock = {
          create: sinon.spy(function(_m, callback) {
            callback(null, createMessageResult);
          })
        };
        const conversationMock = {
          getById: sinon.spy(function(id, callback) {
            expect(id).to.be.equal(conversation);
            callback(new Error(msg));
          }),
          permission: {
            userCanWrite: function() {
              return Q.when(false);
            }
          }
        };
        const module = require('../../../../../backend/lib/listener/message')(dependencies);

        module.start({conversation: conversationMock, message: messageMock});

        messageReceivedListener(data).then(done, function(err) {
          expect(globalPublish).to.not.have.been.called;
          expect(messageMock.create).to.not.have.been.called;
          expect(err.message).to.equal(msg);
          done();
        });
      });

      it('should not save the message when user is not found', function(done) {
        globalPublish = sinon.spy();
        const createMessageResult = 'createMessageResult';
        const messageMock = {
          create: sinon.spy(function(_m, callback) {
            callback(null, createMessageResult);
          })
        };
        const conversationMock = {
          getById: sinon.spy(function(id, callback) {
            expect(id).to.be.equal(conversation);
            callback(null, {members: [{_id: 'id'}], type: 'channel'});
          }),
          permission: {
            userCanWrite: function() {
              return Q.when(false);
            }
          }
        };
        const module = require('../../../../../backend/lib/listener/message')(dependencies);

        module.start({conversation: conversationMock, message: messageMock});

        messageReceivedListener(data).then(done, function(err) {
          expect(globalPublish).to.not.have.been.called;
          expect(messageMock.create).to.not.have.been.called;
          expect(err.message).to.match(/No such user/);
          done();
        });
      });

      it('should not save the message when user.get fails', function(done) {
        const msg = 'user.get error';

        err = new Error(msg);
        globalPublish = sinon.spy();

        const createMessageResult = 'createMessageResult';
        const messageMock = {
          create: sinon.spy(function(_m, callback) {
            callback(null, createMessageResult);
          })
        };
        const conversationMock = {
          getById: sinon.spy(function(id, callback) {
            expect(id).to.be.equal(conversation);
            callback(null, {members: [{_id: 'id'}], type: 'channel'});
          }),
          permission: {
            userCanWrite: function() {
              return Q.when(false);
            }
          }
        };
        const module = require('../../../../../backend/lib/listener/message')(dependencies);

        module.start({conversation: conversationMock, message: messageMock});

        messageReceivedListener(data).then(done, function(err) {
          expect(globalPublish).to.not.have.been.called;
          expect(messageMock.create).to.not.have.been.called;
          expect(err.message).to.equal(msg);
          done();
        });
      });
    });
  });

  describe('The handleMessage function', function() {

    var module;

    beforeEach(function() {
      module = require('../../../../../backend/lib/listener/message')(dependencies);
    });

    it('should call all the handlers', function() {
      var data = {foo: 'bar'};
      var handler1 = sinon.spy();
      var handler2 = sinon.spy();
      var handler3 = sinon.spy();

      module.addHandler(handler1);
      module.addHandler(handler2);
      module.addHandler(handler3);

      module.handleMessage(data);

      expect(handler1).to.have.been.calledWith(data);
      expect(handler2).to.have.been.calledWith(data);
      expect(handler3).to.have.been.calledWith(data);
    });

    it('should call all the handlers even if some fails', function() {
      var data = {foo: 'bar'};

      logger.warn = sinon.stub();
      var handler1 = sinon.spy();
      var handler2 = sinon.stub().throws(new Error('You failed'));
      var handler3 = sinon.spy();

      module.addHandler(handler1);
      module.addHandler(handler2);
      module.addHandler(handler3);

      module.handleMessage(data);

      expect(handler1).to.have.been.calledWith(data);
      expect(handler2).to.have.been.calledWith(data);
      expect(handler3).to.have.been.calledWith(data);
      expect(logger.warn).to.have.been.called;
    });
  });
});
