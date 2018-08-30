'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const Q = require('q');
const { MEMBER_UNSUBSCRIBED_CONVERSATION } = require('../../../backend/lib/constants').NOTIFICATIONS;

describe('The linagora.esn.chat ChatUserSubscribedPrivateConversation lib', function() {

  let lib, deps, mq, mediaQuery, ObjectId, modelsMock, conversation, channelMemberUnsubscribedTopic;

  function dependencies(name) {
    return deps[name];
  }

  beforeEach(function() {

    ObjectId = require('mongoose').Types.ObjectId;

    conversation = {_id: 1, name: 'My conversation'};

    modelsMock = {
      ChatUserSubscribedPrivateConversation: {
        findById: sinon.spy(function() {

          return Q.when(null);
        }),
        findOneAndUpdate: sinon.spy(function() {

          return mq;
        })
      },
      ChatConversation: {
        findById: sinon.spy(function() {

          return mediaQuery;
        })
      }
    };

    mq = {
      exec: sinon.spy(function() {

        return Q.when();
      })
    };

    mediaQuery = {
      exec: sinon.spy(function(cb) {
        cb(null, conversation);
      })
    };

    channelMemberUnsubscribedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    deps = {
      db: {
        mongo: {
          mongoose: {
            model: function(type) {
              return modelsMock[type];
            },
            Types: {
              ObjectId: ObjectId
            }
          }
        }
      },
      pubsub: {
        local: {
          topic: function() {
            return {
              subscribe: sinon.spy(),
              publish: sinon.spy()
            };
          }
        },
        global: {
          topic: function(name) {
            if (name === MEMBER_UNSUBSCRIBED_CONVERSATION) {
              return channelMemberUnsubscribedTopic;
            }
          }
        }
      }
    };

    lib = {
      utils: require('../../../backend/lib/utils')(dependencies)
    };
  });

  describe('The get function', function() {

    it('should call userSubscribedPrivateConversation.findById', function(done) {
      const userId = '0xFF';

      require('../../../backend/lib/user-subscribed-private-conversation')(dependencies, lib).get(userId).then(function() {
        expect(modelsMock.ChatUserSubscribedPrivateConversation.findById).to.have.been.calledWith('0xFF');
        done();
      });
    });
  });

  describe('The store function', function() {

    it('should call findOneAndUpdate to create if subscribed private conversation did not exist', function(done) {
      const userId = '0xFF';
      const conversationIds = ['Id1', 'Id2', 'Id3'];

      require('../../../backend/lib/user-subscribed-private-conversation')(dependencies, lib).store(userId, conversationIds).then(function() {
        expect(modelsMock.ChatUserSubscribedPrivateConversation.findOneAndUpdate).to.have.been.calledWith({_id: userId}, {$set: {conversations: conversationIds}}, {upsert: true, new: true});
        done();
      });
    });

    it('should publish unsubscribed conversation IDs', function(done) {
      const userId = '0xFF';
      const newPrivateConversationIds = ['Id1', 'Id2'];
      const saved = {
        _id: userId,
        conversations: newPrivateConversationIds
      };
      const subscribedPrivateConversation = {
        _id: userId,
        conversations: ['Id1', 'Id2', 'Id3'],
        save: sinon.stub().returns(Q.when(saved))
      };

      modelsMock.ChatUserSubscribedPrivateConversation.findById = sinon.stub().returns(Q.when(subscribedPrivateConversation));

      require('../../../backend/lib/user-subscribed-private-conversation')(dependencies, lib).store(userId, newPrivateConversationIds).then(function() {
        expect(modelsMock.ChatUserSubscribedPrivateConversation.findById).to.have.been.calledWith(userId);
        expect(channelMemberUnsubscribedTopic.publish).to.have.been.calledWith({ userId, conversationIds: ['Id3'] });
        done();
      });
    });
  });

  describe('The getByIds function', function() {

    it('should send back a promise with conversations result', function(done) {
      const conversationIds = ['id1', 'id2'];
      const conversationsResult = [conversation, conversation];

      require('../../../backend/lib/user-subscribed-private-conversation')(dependencies).getByIds(conversationIds).then(function(result) {

        conversationIds.map(function(conversationId) {
          expect(modelsMock.ChatConversation.findById).to.have.been.calledWith(conversationId);
        });

        expect(result).to.deep.equal(conversationsResult);
        done();
      });
    });
  });

});
