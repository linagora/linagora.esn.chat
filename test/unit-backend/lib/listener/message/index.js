'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var mockery = require('mockery');
var _ = require('lodash');
var CONSTANTS = require('../../../../../backend/lib/constants');

describe('The linagora.esn.chat lib message listener module', function() {

  var deps, messageReceivedListener, globalPublish, ChatMessageMock, dependencies, logger, communityCreatedListener, memberAddedListener, comunityUpdateListener;

  beforeEach(function() {
    dependencies = function(name) {
      return deps[name];
    };

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
      var type = 'forwardable_type';
      var data = {
        message: {
          type: type
        },
        room: 'room'
      };

      var channel = {
        createMessage: function() {
          return done(new Error());
        }
      };

      var handler = function(message) {
        expect(message).to.deep.equals(data.message);
        done();
      };

      var module = require('../../../../../backend/lib/listener/message')(dependencies);

      module.addForwardHandler(type, handler);
      module.start(channel);
      messageReceivedListener(data);
    });

    it('should save the message and broadcast to globalpubsub the saved message and if the message is from someone in the channel', function(done) {
      var type = 'text';
      var text = 'yolo';
      var date = '0405';
      var creator = '1';
      var conversation = 'general';
      var attachments = [1, 2, 3];
      var data = {
        message: {
          type: type,
          text: text,
          date: date,
          creator: creator,
          channel: conversation,
          attachments: attachments
        },
        room: 'room'
      };

      var createMessageResult = 'createMessageResult';

      var conversationMock = {
        getById: sinon.spy(function(id, callback) {
          return callback(null, {members: [{_id: creator}]});
        })
      };

      var messageMock = {
        create: sinon.spy(function(_m, callback) {
          callback(null, createMessageResult);
        })
      };

      var module = require('../../../../../backend/lib/listener/message')(dependencies);

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

    it('should not save the message and broadcast to globalpubsub the saved message and if the message is not from someone in the conversation', function(done) {
      var type = 'text';
      var text = 'yolo';
      var date = '0405';
      var creator = '1';
      var conversation = 'general';
      var attachments = [1, 2, 3];
      var data = {
        message: {
          type: type,
          text: text,
          date: date,
          creator: creator,
          channel: conversation,
          attachments: attachments
        },
        room: 'room'
      };

      var createMessageResult = 'createMessageResult';

      var conversationMock = {
        createMessage: sinon.spy(function(_m, callback) {
          callback(null, createMessageResult);
        }),
        getById: sinon.spy(function(id, callback) {
          expect(id).to.be.equal(conversation);
          callback(null, {members: [{_id: 'id'}]});
          expect(globalPublish).to.not.have.been.called;
          expect(conversationMock.createMessage).to.not.have.been.called;
          done();
        })
      };
      var messageMock = {
        create: sinon.spy(function(_m, callback) {
          callback(null, createMessageResult);
        })
      };

      var module = require('../../../../../backend/lib/listener/message')(dependencies);
      module.start({conversation: conversationMock, message: messageMock});

      globalPublish = sinon.spy();
      messageReceivedListener(data);
    });

    it('should save the message and broadcast to globalpubsub the saved message if the conversation is a channel even if the message is not from someone in the channel', function(done) {
      var type = 'text';
      var text = 'yolo';
      var date = '0405';
      var creator = '1';
      var conversation = 'general';
      var attachments = [1, 2, 3];
      var data = {
        message: {
          type: type,
          text: text,
          date: date,
          creator: creator,
          channel: conversation,
          attachments: attachments
        },
        room: 'room'
      };

      var createMessageResult = 'createMessageResult';
      var messageMock = {
        create: sinon.spy(function(_m, callback) {
          callback(null, createMessageResult);
        })
      };

      var conversationMock = {
        getById: sinon.spy(function(id, callback) {
          expect(id).to.be.equal(conversation);
          callback(null, {members: [{_id: 'id'}], type: 'channel'});
          expect(globalPublish).to.have.been.called;
          expect(messageMock.create).to.have.been.called;
          done();
        })
      };

      var module = require('../../../../../backend/lib/listener/message')(dependencies);
      module.start({conversation: conversationMock, message: messageMock});

      globalPublish = sinon.spy();
      messageReceivedListener(data);
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
