'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const CONSTANTS = require('../../../../../backend/lib/constants');

describe('The leave conversation system message handler', function() {
  let deps, dependencies, newMessageTopic, membershipTopic, userId, conversationId;

  beforeEach(function() {
    dependencies = function(name) {
      return deps[name];
    };

    userId = '321';
    conversationId = '123';
    newMessageTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };
    membershipTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    deps = {
      logger: {
        error: sinon.spy(),
        info: sinon.spy(),
        debug: sinon.spy()
      },
      pubsub: {
        local: {
          topic: function(name) {
            if (name === CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED) {
              return newMessageTopic;
            } else if (name === CONSTANTS.NOTIFICATIONS.COLLABORATION_LEAVE) {
              return membershipTopic;
            }
          }
        }
      }
    };
  });

  describe('The start function', function() {
    it('should subscribe to COLLABORATION_LEAVE topic', function() {
      const module = require('../../../../../backend/lib/listener/system/leave-conversation')(dependencies);

      module.start();
      expect(membershipTopic.subscribe).to.have.been.calledOnce;
    });

    it('should publish event on MESSAGE_RECEIVED topic when event collaboration is a conversation', function() {
      let handler;

      membershipTopic.subscribe = function(callback) {
        handler = callback;
      };

      const event = {
        collaboration: {
          objectType: 'chat.conversation',
          id: conversationId
        },
        target: userId
      };
      const module = require('../../../../../backend/lib/listener/system/leave-conversation')(dependencies);

      module.start();
      handler(event);

      expect(newMessageTopic.publish.firstCall.args[0]).to.shallowDeepEqual({
        message: {
          text: '@' + userId + ' has left the conversation.',
          type: 'text',
          subtype: CONSTANTS.MESSAGE_SUBTYPE.CONVERSATION_LEAVE,
          creator: userId,
          channel: conversationId,
          user_mentions: [userId]
        }
      });
    });

    it('should not publish event on MESSAGE_RECEIVED topic when event is for chat conversation', function() {
      let handler;

      membershipTopic.subscribe = function(callback) {
        handler = callback;
      };

      const event = {
        collaboration: {
          objectType: 'community',
          id: 1
        }
      };
      const module = require('../../../../../backend/lib/listener/system/leave-conversation')(dependencies);

      module.start();
      handler(event);

      expect(newMessageTopic.publish).to.not.have.beenCalled;
      expect(deps.logger.debug.secondCall.args[0]).to.match(/is not a conversation, skipping/);
    });
  });
});
