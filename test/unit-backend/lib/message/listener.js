'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var mockery = require('mockery');
var _ = require('lodash');
var CONSTANTS = require('../../../../backend/lib/constants');

describe('The linagora.esn.chat lib listener module', function() {

  var deps, listener, globalPublish, ChatMessageMock, dependencies, logger;

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
          topic: function() {
            return {
              subscribe: function(cb) {
                listener = cb;
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
    });

    it('should not save, populate and keep state when message.type is user_typing', function(done) {
      var data = {
        message: {
          state: 'state',
          type: 'user_typing'
        },
        room: 'room'
      };

      var channel = {
        createMessage: function() {
          return done(new Error());
        }
      };

      var module = require('../../../../backend/lib/message/listener')(dependencies);
      module.start(channel);

      ChatMessageMock.populate = function(field, callback) {
        expect(field).to.equals('creator');
        expect(ChatMessageMock).to.have.been.calledWith(data.message);
        callback(null, {toJSON: _.constant({})});
        expect(globalPublish).to.have.been.calledWith({room: data.room, message: {state: data.message.state}});
        done();
      };
      listener(data);
    });

    it('should save the message when message.type is not user_typing and broadcast to globalpubsub the saved message', function(done) {
      var type = 'text';
      var text = 'yolo';
      var date = '0405';
      var creator = '1';
      var channel = 'general';
      var attachments = [1, 2, 3];
      var data = {
        message: {
          type: type,
          text: text,
          date: date,
          creator: creator,
          channel: channel,
          attachments: attachments
        },
        room: 'room'
      };

      var createMessageResult = 'createMessageResult';

      var channelMock = {
        createMessage: sinon.spy(function(_m, callback) {
          callback(null, createMessageResult);
        })
      };

      var module = require('../../../../backend/lib/message/listener')(dependencies);
      module.start(channelMock);

      globalPublish = function(data) {
        expect(channelMock.createMessage).to.have.been.calledWith({
          type: type,
          text: text,
          date: date,
          creator: creator,
          channel: channel,
          attachments: attachments
        });

        expect(deps.pubsub.global.topic).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED);
        expect(data).to.be.deep.equals({room: data.room, message: createMessageResult});
        done();
      };

      listener(data);
    });
  });

  describe('The handleMessage function', function() {

    var module;

    beforeEach(function() {
      module = require('../../../../backend/lib/message/listener')(dependencies);
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
