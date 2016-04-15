'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var CONSTANTS = require('../../../backend/lib/constants');
var _ = require('lodash');

describe('The Chat WS server', function() {

  var messageReceivedTopic, userStateTopic, logger, getUserId, getUserIdResult, chatNamespace, self;

  function initWs() {
    return require('../../../backend/ws').init(self.moduleHelpers.dependencies);
  }

  beforeEach(function() {
    self = this;
    getUserIdResult = null;
    messageReceivedTopic = {
      subscribe: sinon.spy(), publish: sinon.spy() };

    userStateTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    logger = { info: sinon.spy(), warn: sinon.spy() };

    getUserId = sinon.spy(function() {
      return getUserIdResult;
    });

    chatNamespace = {
      on: sinon.spy(),
      emit: sinon.spy()
    };

    _.forEach({
      pubsub: {
        local: {
          topic: function(name) {
            if (name === CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED) {
              return messageReceivedTopic;
            }
          }
        },
        global: {
          topic: function(name) {
            if (name === 'user:state') {
              return userStateTopic;
            }
          }
        }
      },
      logger: logger,
      wsserver: {
        ioHelper: {getUserId: getUserId},
        io: {
          of: function(name) {
            if (name === CONSTANTS.WEBSOCKET.NAMESPACE) {
              return chatNamespace;
            }
          }
        }
      }
    }, function(value, key) {
      self.moduleHelpers.addDep(key, value);
    });
  });

  it('should listen user:state pubsub and emit it on ws', function() {
    initWs();
    var callbackOnUserStatePubsub;
    expect(userStateTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
      callbackOnUserStatePubsub = callback;
      return _.isFunction(callback);
    }));

    var data = {};
    callbackOnUserStatePubsub(data);

    expect(chatNamespace.emit).to.have.been.calledWith('user:state', data);
  });

  describe('The connexion handler', function() {
    var connectionHandler, socket;

    beforeEach(function() {
      getUserIdResult = 'userId';
      socket = {
        on: sinon.spy(),
        of: sinon.spy(),
        join: sinon.spy(),
        leave: sinon.spy(),
      };

      initWs();

      expect(chatNamespace.on).to.have.been.calledWith('connection', sinon.match(function(handler) {
        connectionHandler = handler;
        return _.isFunction(handler);
      }));
    });

    it('should set on subscribe handler on the given socket', function() {
      connectionHandler(socket);
      expect(socket.on).to.have.been.calledWith('subscribe', sinon.match.func);
    });

    describe('The socket on handler', function() {
      var onSubscribeHandler, room;

      beforeEach(function() {
        room = 'room';
        connectionHandler(socket);
        expect(socket.on).to.have.been.calledWith('subscribe', sinon.match(function(callback) {
          onSubscribeHandler = callback;
          return _.isFunction(callback);
        }));
      });

      it('should put the socket in the given room', function() {
        onSubscribeHandler(room);
        expect(socket.join).to.have.been.calledWith(room);
      });

      it('should listen on message and publish same on local pubsub for received message', function() {
        onSubscribeHandler(room);
        expect(socket.on).to.have.been.calledWith('message', sinon.match.func.and(sinon.match(function(handler) {
          var data = {};
          handler(data);
          expect(messageReceivedTopic.publish).to.have.been.calledWith({
            room: room,
            message: data
          });
          return true;
        })));
      });

      it('should listen on message and send them into the channel', function() {
        onSubscribeHandler(room);
        expect(socket.on).to.have.been.calledWith('message', sinon.match.func.and(sinon.match(function(handler) {
          var data = {};
          handler(data);
          expect(chatNamespace.emit).to.have.been.calledWith('message', {
            room: room,
            data: data
          });
          return true;
        })));
      });

      it('should listen on unsubscribe and leave the corresponding room', function() {
        onSubscribeHandler(room);
        expect(socket.on).to.have.been.calledWith('unsubscribe', sinon.match.func.and(sinon.match(function(handler) {
          handler(room);
          expect(socket.leave).to.have.been.calledWith(room);
          return true;
        })));
      });
    });

  });
});