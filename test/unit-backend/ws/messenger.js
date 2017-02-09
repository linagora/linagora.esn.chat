'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const EventEmitter = require('events').EventEmitter;
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('The chat websocket messenger', function() {
  let channel, conversation, members, message, messenger, logger, lib, options, transport, sendDataToMembersSpy, sendDataToUsersSpy;

  beforeEach(function() {
    members = [];
    channel = 123;
    conversation = {_id: 1, members: members};
    logger = { info: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };
    lib = {
      conversation: {}
    };
    message = {_id: 1, text: 'My message', channel: channel};
    sendDataToMembersSpy = sinon.spy();
    sendDataToUsersSpy = sinon.spy();

    this.moduleHelpers.addDep('logger', logger);
    options = {
      lib: lib,
      dependencies: this.moduleHelpers.dependencies
    };
  });

  beforeEach(function() {
    transport = new (class Transport extends EventEmitter {
      /*eslint class-methods-use-this: "off"*/
      sendDataToMembers(members, type, data) {
        sendDataToMembersSpy(members, type, data);
      }

      sendDataToUsers(type, data) {
        sendDataToUsersSpy(type, data);
      }
    })();
  });

  beforeEach(function() {
    const Messenger = require('../../../backend/ws/messenger');

    messenger = new Messenger(transport, options);
  });

  it('should instanciate with right properties', function() {
    expect(messenger.lib).to.equal(options.lib);
    expect(messenger.transport).to.equal(transport);
    expect(messenger.logger).to.equal(logger);
  });

  it('should listen to transport events', function(done) {
    const messageSpy = sinon.spy();

    messenger.on('message', messageSpy);
    transport.emit('message', message);

    process.nextTick(() => {
      expect(messageSpy).to.have.been.calledWith(message);
      done();
    });
  });

  describe('The conversationCreated function', function() {
    it('should send conversation to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.conversationCreated(conversation);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED, conversation);
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.conversationCreated(conversation);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED, conversation);
    });
  });

  describe('The conversationDeleted function', function() {
    it('should send conversation to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.conversationDeleted(conversation);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED, conversation);
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.conversationDeleted(conversation);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED, conversation);
    });
  });

  describe('The conversationUpdated function', function() {
    it('should send conversation to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.conversationUpdated(conversation);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED, conversation);
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.conversationUpdated(conversation);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED, conversation);
    });
  });

  describe('The newMemberAdded function', function() {
    it('should send conversation to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.newMemberAdded(conversation);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION, conversation);
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.newMemberAdded(conversation);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION, conversation);
    });
  });

  describe('The sendDataToClients function', function() {
    it('should send data to members when conversation is confidential', function() {
      const type = 'MyType';
      const data = 'MyData';

      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.sendDataToClients(conversation, type, data);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, type, data);
    });

    it('should send data to users when conversation is not confidential', function() {
      const type = 'MyType';
      const data = 'MyData';

      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.sendDataToClients(conversation, type, data);

      expect(sendDataToUsersSpy).to.have.been.calledWith(type, data);
    });
  });

  describe('The sendMessage function', function() {
    const room = 'MyRoom';

    it('should not send data when conversation.getById fails', function(done) {
      const err = new Error('I failed');

      lib.conversation.getById = sinon.spy(function(channel, callback) {
        callback(err);
      });

      messenger.sendMessage(room, message);

      process.nextTick(() => {
        expect(lib.conversation.getById).to.have.been.called;
        expect(logger.error).to.have.been.calledWith('Error while getting conversation to send message', err);
        expect(sendDataToUsersSpy).to.not.have.been.called;
        expect(sendDataToMembersSpy).to.not.have.been.called;
        done();
      });
    });

    it('should not send data when conversation can not be found', function(done) {
      lib.conversation.getById = sinon.spy(function(channel, callback) {
        callback();
      });

      messenger.sendMessage(room, message);

      process.nextTick(() => {
        expect(lib.conversation.getById).to.have.been.called;
        expect(logger.warn).to.have.been.calledWith('Can not find conversation to send message');
        expect(sendDataToUsersSpy).to.not.have.been.called;
        expect(sendDataToMembersSpy).to.not.have.been.called;
        done();
      });
    });

    it('should send data to members when conversation is confidential', function(done) {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      lib.conversation.getById = sinon.spy(function(channel, callback) {
        callback(null, conversation);
      });

      messenger.sendMessage(room, message);

      process.nextTick(() => {
        expect(lib.conversation.getById).to.have.been.called;
        expect(sendDataToUsersSpy).to.not.have.been.called;
        expect(sendDataToMembersSpy).to.have.been.called;
        done();
      });
    });

    it('should send data to users when conversation is not confidential', function(done) {
      conversation.type = CONVERSATION_TYPE.OPEN;
      lib.conversation.getById = sinon.spy(function(channel, callback) {
        callback(null, conversation);
      });

      messenger.sendMessage(room, message);

      process.nextTick(() => {
        expect(lib.conversation.getById).to.have.been.called;
        expect(sendDataToUsersSpy).to.have.been.called;
        expect(sendDataToMembersSpy).to.not.have.been.called;
        done();
      });
    });
  });

  describe('The topicUpdated function', function() {
    it('should send conversation to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.topicUpdated(conversation);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED, conversation);
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.topicUpdated(conversation);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED, conversation);
    });
  });
});
