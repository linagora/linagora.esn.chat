'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const _ = require('lodash');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_CREATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED;
const CONVERSATION_DELETED = CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED;
const CONVERSATION_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED;
const MEMBER_ADDED_IN_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
const MESSAGE_RECEIVED = CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED;
const TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;

describe('The chat websocket adapter', function() {

  var adapter, room, message, localMessageReceivedTopic, globalMessageReceivedTopic, conversationAddMemberTopic, logger, conversationCreatedTopic, conversationDeletedTopic, conversationTopicUpdatedTopic, conversationUpdatedTopic;

  beforeEach(function() {
    var self = this;

    room = 'MyRoom';
    message = {_id: 123, text: 'My message'};

    localMessageReceivedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    globalMessageReceivedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    conversationCreatedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    conversationDeletedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    conversationTopicUpdatedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    conversationAddMemberTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    conversationUpdatedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    logger = { info: sinon.spy(), warn: sinon.spy() };

    _.forEach({
      pubsub: {
        local: {
          topic: function(name) {
            if (name === MESSAGE_RECEIVED) {
              return localMessageReceivedTopic;
            }
          }
        },
        global: {
          topic: function(name) {
            if (name === CONVERSATION_CREATED) {
              return conversationCreatedTopic;
            }
            if (name === CONVERSATION_DELETED) {
              return conversationDeletedTopic;
            }
            if (name === TOPIC_UPDATED) {
              return conversationTopicUpdatedTopic;
            }
            if (name === MESSAGE_RECEIVED) {
              return globalMessageReceivedTopic;
            }
            if (name === MEMBER_ADDED_IN_CONVERSATION) {
              return conversationAddMemberTopic;
            }
            if (name === CONVERSATION_UPDATED) {
              return conversationUpdatedTopic;
            }
          }
        }
      },
      logger: logger
    }, function(value, key) {
      self.moduleHelpers.addDep(key, value);
    });
  });

  beforeEach(function() {
    adapter = require('../../../backend/ws/adapter')(this.moduleHelpers.dependencies);
  });

  describe('The bindEvents function', function() {
    let data, subscribeCallback, messenger, conversation;

    beforeEach(function() {
      conversation = {_id: 1, name: 'My conversation'};
      data = {conversation};
      messenger = {
        on: sinon.spy()
      };
    });

    it('should subscribe to CONVERSATION_CREATED event', function() {
      messenger.conversationCreated = sinon.spy();
      adapter.bindEvents(messenger);

      expect(conversationCreatedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      expect(messenger.conversationCreated).to.have.been.calledWith(data);
    });

    it('should subscribe to CONVERSATION_DELETED event', function() {
      messenger.conversationDeleted = sinon.spy();
      adapter.bindEvents(messenger);

      expect(conversationDeletedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      expect(messenger.conversationDeleted).to.have.been.calledWith(data);
    });

    it('should subscribe to CONVERSATION_UPDATED event', function() {
      messenger.conversationUpdated = sinon.spy();
      adapter.bindEvents(messenger);

      expect(conversationUpdatedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      expect(messenger.conversationUpdated).to.have.been.calledWith(conversation);
    });

    it('should subscribe to TOPIC_UPDATED event', function() {
      messenger.topicUpdated = sinon.spy();
      adapter.bindEvents(messenger);

      expect(conversationTopicUpdatedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      expect(messenger.topicUpdated).to.have.been.calledWith(data);
    });

    it('should subscribe to MEMBER_ADDED_IN_CONVERSATION event', function() {
      messenger.newMemberAdded = sinon.spy();
      adapter.bindEvents(messenger);

      expect(conversationAddMemberTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      expect(messenger.newMemberAdded).to.have.been.calledWith(data);
    });

    it('should subscribe to MESSAGE_RECEIVED event', function() {
      data = {room, message};
      messenger.sendMessage = sinon.spy();
      adapter.bindEvents(messenger);

      expect(globalMessageReceivedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      expect(messenger.sendMessage).to.have.been.calledWith(data.room, data.message);
    });

    it('should publish a message in local pubsub on messenger "message" event', function() {
      data = {room, message};

      adapter.bindEvents(messenger);

      expect(messenger.on).to.have.been.calledWith('message', sinon.match.func.and(sinon.match(function(handler) {
        handler(data);
        expect(localMessageReceivedTopic.publish).to.have.been.calledWith({
          room: room,
          message: data
        });

        return true;
      })));
    });
  });
});
