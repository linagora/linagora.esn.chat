'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const CONSTANTS = require('../../../../../backend/lib/constants');

describe('The member-added conversation collaboration message handler', function() {
  let deps, dependencies, memberAddedTopic, joinMembershipTopic, userId, conversationId;

  beforeEach(function() {
    dependencies = function(name) {
      return deps[name];
    };

    userId = '456';
    conversationId = '789';
    memberAddedTopic = {
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
            if (name === CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_TO_CONVERSATION) {
              return memberAddedTopic;
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
    return require('../../../../../backend/lib/listener/collaboration/member-added')(dependencies);
  }

  describe('The start function', function() {
    it('should subscribe to COLLABORATION_JOIN topic', function() {
      getModule().start();

      expect(joinMembershipTopic.subscribe).to.have.been.calledOnce;
    });

    it('should publish event on MEMBER_ADDED_TO_CONVERSATION topic when event collaboration is conversation and author is not target', function() {
      let handler;

      joinMembershipTopic.subscribe = function(callback) {
        handler = callback;
      };

      const event = {
        collaboration: {
          objectType: 'chat.conversation',
          id: conversationId
        },
        target: userId,
        author: `!${userId}`
      };

      getModule().start();
      handler(event);

      expect(memberAddedTopic.publish).to.have.been.calledWith({userId: event.target, authorId: event.author, conversationId: event.collaboration.id});
    });

    it('should not publish event on MEMBER_ADDED_TO_CONVERSATION topic when event collaboration is conversation and author is same as target', function() {
      let handler;

      joinMembershipTopic.subscribe = function(callback) {
        handler = callback;
      };

      const event = {
        collaboration: {
          objectType: 'chat.conversation',
          id: conversationId
        },
        target: userId,
        author: userId
      };

      getModule().start();
      handler(event);

      expect(memberAddedTopic.publish).to.not.have.been.called;
    });

    it('should not publish event on MEMBER_ADDED_TO_CONVERSATION topic when event collaboration is not conversation', function() {
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

      expect(memberAddedTopic.publish).to.not.have.beenCalled;
      expect(deps.logger.debug.secondCall.args[0]).to.match(/is not a conversation, skipping/);
    });
  });
});
