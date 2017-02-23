'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const CONSTANTS = require('../../../../../backend/lib/constants');

describe('The leave conversation collaboration message handler', function() {
  let deps, dependencies, leaveMembershipTopic, memberLeftTopic, userId, conversationId;

  beforeEach(function() {
    dependencies = function(name) {
      return deps[name];
    };

    userId = '456';
    conversationId = '789';
    memberLeftTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };
    leaveMembershipTopic = {
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
        global: {
          topic: function(name) {
            if (name === CONSTANTS.NOTIFICATIONS.MEMBER_LEFT_CONVERSATION) {
              return memberLeftTopic;
            }
          }
        },
        local: {
          topic: function(name) {
            if (name === CONSTANTS.NOTIFICATIONS.COLLABORATION_LEAVE) {
              return leaveMembershipTopic;
            }
          }
        }
      }
    };
  });

  function getModule() {
    return require('../../../../../backend/lib/listener/collaboration/leave')(dependencies);
  }

  describe('The start function', function() {
    it('should subscribe to COLLABORATION_LEAVE topic', function() {
      getModule().start();

      expect(leaveMembershipTopic.subscribe).to.have.been.calledOnce;
    });

    it('should publish event on MEMBER_LEFT_CONVERSATION topic when event collaboration is conversation', function() {
      let handler;

      leaveMembershipTopic.subscribe = function(callback) {
        handler = callback;
      };

      const event = {
        collaboration: {
          objectType: 'chat.conversation',
          id: conversationId
        },
        target: userId
      };

      getModule().start();
      handler(event);

      expect(memberLeftTopic.publish).to.have.been.calledWith({userId: event.target, conversationId: event.collaboration.id});
    });

    it('should not publish event on MEMBER_LEFT_CONVERSATION topic when event collaboration is not conversation', function() {
      let handler;

      leaveMembershipTopic.subscribe = function(callback) {
        handler = callback;
      };

      const event = {
        collaboration: {
          objectType: 'community',
          id: 1
        }
      };

      getModule().start();
      handler(event);

      expect(memberLeftTopic.publish).to.not.have.beenCalled;
      expect(deps.logger.debug.secondCall.args[0]).to.match(/is not a conversation, skipping/);
    });
  });
});
