'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const CONSTANTS = require('../../../../../backend/lib/constants');

describe('The update topic system message handler', function() {

  let clock, deps, dependencies, newMessageTopic, topicUpdateTopic, domainId, userId, conversationId, timestamp;

  beforeEach(function() {
    dependencies = function(name) {
      return deps[name];
    };

    clock = sinon.useFakeTimers();

    domainId = '123';
    userId = '456';
    conversationId = '789';
    timestamp = Date.now();

    newMessageTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    topicUpdateTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    deps = {
      logger: {
        /*eslint no-console: ["error", { allow: ["log"] }] */
        error: console.log,
        info: console.log,
        debug: console.log
      },
      pubsub: {
        local: {
          topic: function(name) {
            if (name === CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED) {
              return newMessageTopic;
            } else if (name === CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED) {
              return topicUpdateTopic;
            }
          }
        }
      }
    };
  });

  afterEach(function() {
    clock.restore();
  });

  describe('The start function', function() {
    it('should subscribe to TOPIC_UPDATE topic', function() {
      const module = require('../../../../../backend/lib/listener/system/update-topic')(dependencies);

      module.start();
      expect(topicUpdateTopic.subscribe).to.have.been.calledOnce;
    });

    it('should publish event on MESSAGE_RECEIVED topic with update message when topic has been updated', function(done) {
      let handler;

      topicUpdateTopic.subscribe = function(callback) {
        handler = callback;
      };

      const topicValue = 'My old topic';
      const newTopicValue = 'My new topic';
      const conv = {
        domain: domainId
      };
      const conversation = {
        getById: sinon.spy(function(id, callback) {
          conv._id = id;

          callback(null, conv);
        })
      };
      const event = {
        userId: userId,
        conversationId: conversationId,
        topic: newTopicValue,
        old_topic: topicValue,
        timestamp: timestamp
      };
      const module = require('../../../../../backend/lib/listener/system/update-topic')(dependencies, {conversation});

      module.start();
      handler(event).then(() => {
        expect(newMessageTopic.publish).to.have.been.calledWith({
          room: domainId,
          message: {
            text: `@${userId} updated the conversation topic from ${topicValue} to ${newTopicValue}.`,
            type: 'text',
            subtype: CONSTANTS.MESSAGE_SUBTYPE.TOPIC_UPDATE,
            creator: userId,
            channel: conversationId,
            user_mentions: [userId],
            timestamps: {creation: timestamp}
          }
        });
        done();
      }, done);
    });

    it('should publish event on MESSAGE_RECEIVED topic with set message when topic has been updated', function(done) {
      let handler;

      topicUpdateTopic.subscribe = function(callback) {
        handler = callback;
      };

      const newTopicValue = 'My new topic';
      const conv = {
        domain: domainId
      };
      const conversation = {
        getById: sinon.spy(function(id, callback) {
          conv._id = id;

          callback(null, conv);
        })
      };
      const event = {
        userId: userId,
        conversationId: conversationId,
        topic: newTopicValue,
        timestamp: timestamp
      };
      const module = require('../../../../../backend/lib/listener/system/update-topic')(dependencies, {conversation});

      module.start();
      handler(event).then(() => {
        expect(newMessageTopic.publish).to.have.been.calledWith({
          room: domainId,
          message: {
            text: `@${userId} had set the conversation topic to ${newTopicValue}.`,
            type: 'text',
            subtype: CONSTANTS.MESSAGE_SUBTYPE.TOPIC_UPDATE,
            creator: userId,
            channel: conversationId,
            user_mentions: [userId],
            timestamps: {creation: timestamp}
          }
        });
        done();
      }, done);
    });

  });
});
