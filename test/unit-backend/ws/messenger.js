'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const EventEmitter = require('events').EventEmitter;
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const DEFAULT_ROOM = CONSTANTS.WEBSOCKET.DEFAULT_ROOM;

describe('The chat websocket messenger', function() {
  let channel, conversation, members, message, messenger, logger, options, transport, sendDataToMembersSpy, sendDataToUsersSpy, sendDataToUserSpy;

  beforeEach(function() {
    members = [];
    channel = 123;
    conversation = {_id: 1, members: members};
    logger = { info: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };
    message = {_id: 1, text: 'My message', channel: channel};
    sendDataToMembersSpy = sinon.spy();
    sendDataToUsersSpy = sinon.spy();
    sendDataToUserSpy = sinon.spy();

    this.moduleHelpers.addDep('logger', logger);
    options = {
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

      sendDataToUser(user, type, data) {
        sendDataToUserSpy(user, type, data);
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

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED, {data: conversation, room: DEFAULT_ROOM});
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.conversationCreated(conversation);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED, {data: conversation, room: DEFAULT_ROOM});
    });
  });

  describe('The conversationDeleted function', function() {
    it('should send conversation to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.conversationDeleted(conversation);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED, {data: conversation, room: DEFAULT_ROOM});
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.conversationDeleted(conversation);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED, {data: conversation, room: DEFAULT_ROOM});
    });
  });

  describe('The conversationUpdated function', function() {
    it('should send conversation to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.conversationUpdated(conversation);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED, {data: conversation, room: DEFAULT_ROOM});
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.conversationUpdated(conversation);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED, {data: conversation, room: DEFAULT_ROOM});
    });
  });

  describe('The memberHasJoined function', function() {
    let member, members_count;

    beforeEach(function() {
      member = {member: {id: '1', objectType: 'user'}};
      members_count = 10;
    });

    it('should send conversation to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.memberHasJoined(conversation, member, members_count);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.MEMBER_JOINED_CONVERSATION, {data: {conversation, member, members_count}, room: DEFAULT_ROOM});
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.memberHasJoined(conversation, member, members_count);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.MEMBER_JOINED_CONVERSATION, {data: {conversation, member, members_count}, room: DEFAULT_ROOM});
    });
  });

  describe('The memberHasLeft function', function() {
    let member, members_count;

    beforeEach(function() {
      member = {member: {id: '1', objectType: 'user'}};
      members_count = 10;
    });

    it('should send conversation to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.memberHasLeft(conversation, member, members_count);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.MEMBER_LEFT_CONVERSATION, {data: {conversation, member, members_count}, room: DEFAULT_ROOM});
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.memberHasLeft(conversation, member, members_count);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.MEMBER_LEFT_CONVERSATION, {data: {conversation, member, members_count}, room: DEFAULT_ROOM});
    });
  });

  describe('The memberHasBeenAdded function', function() {
    let member, by_member;

    beforeEach(function() {
      member = {member: {id: '1', objectType: 'user'}};
      by_member = {member: {id: '2', objectType: 'user'}};
    });

    it('should send conversation to user', function() {
      messenger.memberHasBeenAdded(conversation, member, by_member);

      expect(sendDataToUserSpy).to.have.been.calledWith(member.member._id, CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_TO_CONVERSATION, {data: {conversation, member, by_member}, room: DEFAULT_ROOM});
    });
  });

  describe('The sendDataToClients function', function() {
    it('should send data to members when conversation is confidential', function() {
      const type = 'MyType';
      const data = {data: 'MyData'};

      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.sendDataToClients(conversation, type, data);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, type, {data: data, room: DEFAULT_ROOM});
    });

    it('should send data to users when conversation is not confidential', function() {
      const type = 'MyType';
      const data = {data: 'MyData'};

      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.sendDataToClients(conversation, type, data);

      expect(sendDataToUsersSpy).to.have.been.calledWith(type, {data: data, room: DEFAULT_ROOM});
    });
  });

  describe('The sendMessage function', function() {
    const room = 'MyRoom';

    it('should send data to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      messenger.sendMessage(conversation, room, message);

      expect(sendDataToUsersSpy).to.not.have.been.called;
      expect(sendDataToMembersSpy).to.have.been.called;
    });

    it('should send data to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.sendMessage(conversation, room, message);

      expect(sendDataToUsersSpy).to.have.been.called;
      expect(sendDataToMembersSpy).to.not.have.been.called;
    });
  });

  describe('The topicUpdated function', function() {
    it('should send conversation to members when conversation is confidential', function() {
      conversation.type = CONVERSATION_TYPE.CONFIDENTIAL;
      conversation.members = [1, 2, 3];
      messenger.topicUpdated(conversation);

      expect(sendDataToMembersSpy).to.have.been.calledWith(conversation.members, CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED, {data: conversation, room: DEFAULT_ROOM});
    });

    it('should send conversation to users when conversation is not confidential', function() {
      conversation.type = CONVERSATION_TYPE.OPEN;
      messenger.topicUpdated(conversation);

      expect(sendDataToUsersSpy).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED, {data: conversation, room: DEFAULT_ROOM});
    });
  });

  describe('The sendMessageToUser function', function() {
    it('should call transport.sendDataToUser function', function() {
      const user = '1';

      messenger.sendMessageToUser(user, message);

      expect(sendDataToUserSpy).to.have.been.calledWith(user, 'message', {data: message, room: DEFAULT_ROOM});
    });
  });

  describe('The sendDataToUser function', function() {
    it('should call transport.sendDataToUser function', function() {
      const user = '1';
      const type = 'MyType';

      messenger.sendDataToUser(user, type, message);

      expect(sendDataToUserSpy).to.have.been.calledWith(user, type, {data: message, room: DEFAULT_ROOM});
    });
  });
});
