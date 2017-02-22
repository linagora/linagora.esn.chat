'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const CONSTANTS = require('../../../../../backend/lib/constants');

describe('The join conversation collaboration message handler', function() {
  let deps, dependencies, memberJoinedTopic, joinMembershipTopic, userId, conversationId;

  beforeEach(function() {
    dependencies = function(name) {
      return deps[name];
    };

    userId = '456';
    conversationId = '789';
    memberJoinedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };
    joinMembershipTopic = {
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
            if (name === CONSTANTS.NOTIFICATIONS.MEMBER_JOINED_CONVERSATION) {
              return memberJoinedTopic;
            }
          }
        },
        local: {
          topic: function(name) {
            if (name === CONSTANTS.NOTIFICATIONS.COLLABORATION_JOIN) {
              return joinMembershipTopic;
            }
          }
        }
      }
    };
  });

  function getModule() {
    return require('../../../../../backend/lib/listener/collaboration/join')(dependencies);
  }

  describe('The start function', function() {
    it('should subscribe to COLLABORATION_JOIN topic', function() {
      getModule().start();

      expect(joinMembershipTopic.subscribe).to.have.been.calledOnce;
    });

    it('should publish event on MEMBER_JOINED_CONVERSATION topic when event collaboration is conversation', function() {
      let handler;

      joinMembershipTopic.subscribe = function(callback) {
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

      expect(memberJoinedTopic.publish).to.have.been.calledWith({userId: event.target, conversationId: event.collaboration.id});
    });

    it('should not publish event on MEMBER_JOINED_CONVERSATION topic when event collaboration is not conversation', function() {
      let handler;

      joinMembershipTopic.subscribe = function(callback) {
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

      expect(memberJoinedTopic.publish).to.not.have.beenCalled;
      expect(deps.logger.debug.secondCall.args[0]).to.match(/is not a conversation, skipping/);
    });
  });
});
