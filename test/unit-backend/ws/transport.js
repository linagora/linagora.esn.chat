'use strict';

const _ = require('lodash');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('The chat websocket transport', function() {
  let channel, ioHelper, logger, options, transport, message, chatNamespace;

  beforeEach(function() {
    channel = 123;
    logger = { info: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };
    message = {_id: 1, text: 'My message', channel: channel};
    chatNamespace = {
      on: sinon.spy(),
      emit: sinon.spy()
    };
    ioHelper = {
      getUserSocketsFromNamespace: sinon.spy(),
      getUserId: sinon.spy()
    };

    this.moduleHelpers.addDep('wsserver', { ioHelper });
    this.moduleHelpers.addDep('logger', logger);
    options = {
      dependencies: this.moduleHelpers.dependencies
    };
  });

  beforeEach(function() {
    const Transport = require('../../../backend/ws/transport');

    transport = new Transport(chatNamespace, options);
  });

  it('should instanciate with right properties', function() {
    expect(transport.chatNamespace).to.equal(chatNamespace);
    expect(transport.helper).to.equal(ioHelper);
    expect(transport.logger).to.equal(logger);
    expect(chatNamespace.on).to.have.been.calledOnce;
  });

  describe('The sendDataToMembers function', function() {
    it('should emit message on each member socket', function() {
      const socketA = {emit: sinon.spy()};
      const socketB = {emit: sinon.spy()};
      const socketC = {emit: sinon.spy()};
      const socketD = {emit: sinon.spy()};
      const type = 'MyType';
      const data = 'MyData';
      const members = [{member: {id: 1}}, {member: {id: 2}}, {member: {id: 3}}];

      ioHelper.getUserSocketsFromNamespace = sinon.stub();
      ioHelper.getUserSocketsFromNamespace.onCall(0).returns([socketA]);
      ioHelper.getUserSocketsFromNamespace.onCall(1).returns([socketB]);
      ioHelper.getUserSocketsFromNamespace.onCall(2).returns([socketC, socketD]);

      transport.sendDataToMembers(members, type, data);

      expect(ioHelper.getUserSocketsFromNamespace).to.have.been.calledThrice;
      expect(socketA.emit).to.have.been.calledOnce;
      expect(socketA.emit).to.have.been.calledWith(type, data);
      expect(socketB.emit).to.have.been.calledOnce;
      expect(socketB.emit).to.have.been.calledWith(type, data);
      expect(socketC.emit).to.have.been.calledOnce;
      expect(socketC.emit).to.have.been.calledWith(type, data);
      expect(socketD.emit).to.have.been.calledOnce;
      expect(socketD.emit).to.have.been.calledWith(type, data);
    });
  });

  describe('The sendDataToUsers function', function() {
    it('should emit message on chatNamespace', function() {
      const type = 'MyType';
      const data = 'MyData';

      transport.sendDataToUsers(type, data);

      expect(chatNamespace.emit).to.have.been.calledOnce;
      expect(chatNamespace.emit).to.have.been.calledWith(type, data);
    });
  });

  describe('The listenToEvents function', function() {
    let socket, room, onSubscribeHandler, connectionHandler;

    beforeEach(function() {
      socket = {
        on: sinon.spy(),
        join: sinon.spy(),
        leave: sinon.spy()
      };
      room = 'MyRoom';

      transport.listenToEvents();

      expect(chatNamespace.on).to.have.been.calledWith('connection', sinon.match(function(handler) {
        connectionHandler = handler;

        return _.isFunction(handler);
      }));
    });

    it('should set on subscribe handler', function() {
      connectionHandler(socket);

      expect(socket.on).to.have.been.calledWith('subscribe', sinon.match.func);
    });

    describe('The socket.on handler', function() {
      beforeEach(function() {
        connectionHandler(socket);
        expect(socket.on).to.have.been.calledWith('subscribe', sinon.match(function(callback) {
          onSubscribeHandler = callback;

          return _.isFunction(callback);
        }));
      });

      it('should join the socket room on socket "subscribe" message', function() {
        onSubscribeHandler(room);

        expect(socket.join).to.have.been.calledWith(room);
      });

      it('should leave the room on socket "unsubscribe" message', function() {
        onSubscribeHandler(room);

        expect(socket.on).to.have.been.calledWith('unsubscribe', sinon.match.func.and(sinon.match(function(handler) {
          handler(room);
          expect(socket.leave).to.have.been.calledWith(room);

          return true;
        })));
      });

      it('should emit an event on socket "message" message', function(done) {
        transport.on('message', function(event) {
          expect(event).to.shallowDeepEqual(message);
          done();
        });

        onSubscribeHandler(room);

        expect(socket.on).to.have.been.calledWith('message', sinon.match.func.and(sinon.match(function(handler) {
          handler(message);

          return true;
        })));
      });
    });
  });
});
