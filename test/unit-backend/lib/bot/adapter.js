'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const EventEmitter = require('events').EventEmitter;
const Adapter = require('../../../../backend/lib/bot/adapter');

describe('The bot chat adapter', function() {
  let messenger, sendMessageToUserSpy, sendMessageSpy, dependencies, lib;

  beforeEach(function() {
    sendMessageToUserSpy = sinon.spy();
    sendMessageSpy = sinon.spy();
    dependencies = this.moduleHelpers.dependencies;
    lib = {
      conversation: {}
    };

    messenger = new (class Messenger extends EventEmitter {
      /*eslint class-methods-use-this: "off"*/
      sendMessageToUser(user, message) {
        sendMessageToUserSpy(user, message);
      }

      sendMessage(conversation, message) {
        sendMessageSpy(conversation, message);
      }
    })();
  });

  describe('when instanciating', function() {
    it('should add a listener to the messenger emitter', function() {
      const onSpy = sinon.spy(messenger, 'on');
      const adapter = new Adapter(dependencies, lib, messenger);

      expect(adapter.lib).to.equal(lib);
      expect(adapter.dependencies).to.equal(dependencies);
      expect(adapter.messenger).to.equal(messenger);
      expect(onSpy).to.have.been.calledOnce;
    });
  });

  describe('The onMessage function', function() {
    it('should emit event when message type is text', function() {
      const message = {type: 'text', creator: '1', channel: '2'};
      const adapter = new Adapter(dependencies, lib, messenger);
      const emitSpy = sinon.spy(adapter, 'emit');

      adapter.onMessage(message);

      expect(emitSpy).to.have.been.calledWith('message', message);
      expect(message.room).to.equal(message.channel);
      expect(message.user).to.equal(message.creator);
    });

    it('should not emit event when message type is not text', function() {
      const message = {type: 'nottext', creator: '1', channel: '2'};
      const adapter = new Adapter(dependencies, lib, messenger);
      const emitSpy = sinon.spy(adapter, 'emit');

      adapter.onMessage(message);

      expect(emitSpy).to.not.have.been.called;
    });
  });

  describe('The reply function', function() {
    it('should send message back to user', function() {
      const adapter = new Adapter(dependencies, lib, messenger);
      const message = {_id: 1};
      const context = {user: 2};

      adapter.reply(context, message);

      expect(sendMessageToUserSpy).to.have.been.calledWith(context.user, message);
      expect(message.type).to.equal('bot');
    });
  });

  describe('The send function', function() {
    it('should send message back to conversation', function() {
      const adapter = new Adapter(dependencies, lib, messenger);
      const message = {_id: 1};
      const context = {user: 2};
      const conversation = {_id: 3};

      lib.conversation.getById = sinon.spy(function(channel, callback) {
        callback(null, conversation);
      });

      adapter.send(context, message);

      expect(sendMessageSpy).to.have.been.calledWith(conversation, message);
      expect(message.type).to.equal('bot');
    });

    it('should not send message back to conversation when conversation is not found', function() {
      const adapter = new Adapter(dependencies, lib, messenger);
      const message = {_id: 1};
      const context = {user: 2};

      lib.conversation.getById = sinon.spy(function(channel, callback) {
        callback();
      });

      adapter.send(context, message);

      expect(sendMessageSpy).to.not.have.been.called;
    });

    it('should not send message back to conversation when conversation get fails', function() {
      const adapter = new Adapter(dependencies, lib, messenger);
      const message = {_id: 1};
      const context = {user: 2};

      lib.conversation.getById = sinon.spy(function(channel, callback) {
        callback(new Error('I failed'));
      });

      adapter.send(context, message);

      expect(sendMessageSpy).to.not.have.been.called;
    });
  });

  describe('When messenger emit events', function() {
    it('should not emit if message type is not "text"', function() {
      const message = {type: 'nottext', creator: '1', channel: '2'};
      const adapter = new Adapter(dependencies, lib, messenger);
      const emitSpy = sinon.spy(adapter, 'emit');

      messenger.emit('message', message);

      expect(emitSpy).to.not.have.been.called;
    });

    it('should not emit if event is not "message"', function() {
      const adapter = new Adapter(dependencies, lib, messenger);
      const emitSpy = sinon.spy(adapter, 'emit');

      messenger.emit('notmessage');

      expect(emitSpy).to.not.have.been.called;
    });

    it('should emit if message type is "text"', function() {
      const message = {type: 'text', creator: '1', channel: '2'};
      const adapter = new Adapter(dependencies, lib, messenger);
      const emitSpy = sinon.spy(adapter, 'emit');

      messenger.emit('message', message);

      expect(emitSpy).to.have.been.calledWith('message', message);
    });
  });
});
