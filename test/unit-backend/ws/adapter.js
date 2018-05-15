'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const _ = require('lodash');
const Q = require('q');
const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_CREATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED;
const CONVERSATION_DELETED = CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED;
const CONVERSATION_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED;
const MEMBER_ADDED_TO_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_TO_CONVERSATION;
const MEMBER_JOINED_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_JOINED_CONVERSATION;
const MEMBER_LEFT_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_LEFT_CONVERSATION;
const MESSAGE_RECEIVED = CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED;
const CONVERSATION_TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED;
const MEMBER_READ_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_READ_CONVERSATION;

describe('The chat websocket adapter', function() {

  var adapter, lib, message, localMessageReceivedTopic, globalMessageReceivedTopic, conversationAddMemberTopic, conversationRemoveMemberTopic, logger, conversationCreatedTopic, conversationDeletedTopic, conversationTopicUpdatedTopic, conversationUpdatedTopic, conversationMemberAddedTopic, setUserUnreadMessagesCountTopic;

  beforeEach(function() {
    var self = this;

    message = {_id: 123, text: 'My message', channel: 456};

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

    conversationMemberAddedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    conversationAddMemberTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    conversationRemoveMemberTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    conversationUpdatedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    setUserUnreadMessagesCountTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    lib = {
      conversation: {},
      members: {}
    };

    logger = { info: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };

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
            if (name === CONVERSATION_TOPIC_UPDATED) {
              return conversationTopicUpdatedTopic;
            }
            if (name === MESSAGE_RECEIVED) {
              return globalMessageReceivedTopic;
            }
            if (name === MEMBER_ADDED_TO_CONVERSATION) {
              return conversationMemberAddedTopic;
            }
            if (name === MEMBER_JOINED_CONVERSATION) {
              return conversationAddMemberTopic;
            }
            if (name === MEMBER_LEFT_CONVERSATION) {
              return conversationRemoveMemberTopic;
            }
            if (name === CONVERSATION_UPDATED) {
              return conversationUpdatedTopic;
            }
            if (name === MEMBER_READ_CONVERSATION) {
              return setUserUnreadMessagesCountTopic;
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
    adapter = require('../../../backend/ws/adapter')(this.moduleHelpers.dependencies, lib);
  });

  describe('The bindEvents function', function() {
    let data, subscribeCallback, messenger, conversation, user;

    beforeEach(function() {
      conversation = {_id: 1, name: 'My conversation'};
      user = {_id: 2};
      data = {conversation};
      messenger = {
        on: sinon.spy(),
        conversationCreated: sinon.spy(),
        conversationDeleted: sinon.spy(),
        conversationUpdated: sinon.spy(),
        memberHasBeenAdded: sinon.spy(),
        memberHasJoined: sinon.spy(),
        memberHasLeft: sinon.spy(),
        sendMessage: sinon.spy(),
        topicUpdated: sinon.spy(),
        sendDataToUser: sinon.spy()
      };
    });

    it('should subscribe to CONVERSATION_CREATED event', function() {
      adapter.bindEvents(messenger);

      expect(conversationCreatedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      expect(messenger.conversationCreated).to.have.been.calledWith(data);
    });

    it('should subscribe to CONVERSATION_DELETED event', function() {
      adapter.bindEvents(messenger);

      expect(conversationDeletedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      expect(messenger.conversationDeleted).to.have.been.calledWith(data);
    });

    it('should subscribe to CONVERSATION_UPDATED event', function() {
      adapter.bindEvents(messenger);

      expect(conversationUpdatedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      expect(messenger.conversationUpdated).to.have.been.calledWith(conversation);
    });

    it('should subscribe to CONVERSATION_TOPIC_UPDATED event', function(done) {
      const result = {
        toObject: function() {
          return conversation;
        }
      };

      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback(null, result);
      });
      adapter.bindEvents(messenger);

      expect(conversationTopicUpdatedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      process.nextTick(function() {
        expect(messenger.topicUpdated).to.have.been.calledWith(conversation);
        expect(lib.conversation.getById).to.have.been.called;
        done();
      });
    });

    it('should subscribe to CONVERSATION_TOPIC_UPDATED event but not call messenger when conversation.getById fails', function(done) {
      const error = new Error('I failed');

      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback(error);
      });
      adapter.bindEvents(messenger);

      expect(conversationTopicUpdatedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      process.nextTick(function() {
        expect(messenger.topicUpdated).to.not.have.been.called;
        expect(lib.conversation.getById).to.have.been.called;
        expect(logger.error).to.have.been.calledWith('Error while getting conversation for topic update', error);
        done();
      });
    });

    it('should subscribe to CONVERSATION_TOPIC_UPDATED event but not call messenger when conversation.getById does not return conversation', function(done) {
      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback();
      });
      adapter.bindEvents(messenger);

      expect(conversationTopicUpdatedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      process.nextTick(function() {
        expect(messenger.topicUpdated).to.not.have.been.called;
        expect(lib.conversation.getById).to.have.been.called;
        expect(logger.error).to.have.been.called;
        expect(logger.error.args[0][0]).to.equal('Error while getting conversation for topic update');
        expect(logger.error.args[0][1].message).to.match(/Can not find conversation/);
        done();
      });
    });

    it('should subscribe to MEMBER_JOINED_CONVERSATION event', function() {
      adapter.bindEvents(messenger);

      expect(conversationAddMemberTopic.subscribe).to.have.been.calledWith(sinon.match.func);
    });

    describe('On MEMBER_JOINED_CONVERSATION event', function() {
      let count, member, event, joinCallback;

      beforeEach(function() {
        count = 10;
        event = {userId: user._id, conversationId: conversation._id};
        member = {member: {id: user._id, objectType: 'user'}};
      });

      it('should not call messenger.memberHasJoined if getConversation fails', function(done) {
        const error = new Error('I failed to get conversation');

        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback(error);
        });

        adapter.bindEvents(messenger);

        expect(conversationAddMemberTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          joinCallback = callback;

          return _.isFunction(callback);
        }));

        joinCallback(event).then(() => {
          done(new Error('Should not be called'));
        }, err => {
          expect(err.message).to.equals(error.message);
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(messenger.memberHasJoined).to.not.have.been.called;
          done();
        });
      });

      it('should not call messenger.memberHasJoined if getConversation can not be found', function(done) {
        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback();
        });

        adapter.bindEvents(messenger);

        expect(conversationAddMemberTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          joinCallback = callback;

          return _.isFunction(callback);
        }));

        joinCallback(event).then(() => {
          done(new Error('Should not be called'));
        }, err => {
          expect(err.message).to.match(/Can not find conversation/);
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(messenger.memberHasJoined).to.not.have.been.called;
          done();
        });
      });

      it('should not call messenger.memberHasJoined if countMembers fails', function(done) {
        const error = new Error('I failed to count');

        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback(null, conversation);
        });

        lib.members.countMembers = sinon.spy(function() {
          return Q.reject(error);
        });

        adapter.bindEvents(messenger);

        expect(conversationAddMemberTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          joinCallback = callback;

          return _.isFunction(callback);
        }));

        joinCallback(event).then(() => {
          done(new Error('Should not be called'));
        }, err => {
          expect(err.message).to.match(/I failed to count/);
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(lib.members.countMembers).to.have.been.calledWith(conversation);
          expect(messenger.memberHasJoined).to.not.have.been.called;
          done();
        });
      });

      it('should call messenger.memberHasJoined', function(done) {
        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback(null, conversation);
        });

        lib.members.countMembers = sinon.spy(function() {
          return Q.when(count);
        });

        adapter.bindEvents(messenger);

        expect(conversationAddMemberTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          joinCallback = callback;

          return _.isFunction(callback);
        }));

        joinCallback(event).then(() => {
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(lib.members.countMembers).to.have.been.calledWith(conversation);
          expect(messenger.memberHasJoined).to.have.been.calledWith(conversation, member, count);
          done();
        }, done);
      });
    });

    it('should subscribe to MEMBER_ADDED_TO_CONVERSATION event', function() {
      adapter.bindEvents(messenger);

      expect(conversationMemberAddedTopic.subscribe).to.have.been.calledWith(sinon.match.func);
    });

    describe('On MEMBER_ADDED_TO_CONVERSATION event', function() {
      let member, event, joinCallback, author, authorMember;

      beforeEach(function() {
        author = {_id: 'author'};
        event = {userId: user._id, authorId: author._id, conversationId: conversation._id};
        member = {member: {id: user._id, objectType: 'user'}};
        authorMember = {member: {id: author._id, objectType: 'user'}};
      });

      it('should not call messenger.memberHasBeenAdded if getConversation fails', function(done) {
        const error = new Error('I failed to get conversation');

        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback(error);
        });

        adapter.bindEvents(messenger);

        expect(conversationMemberAddedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          joinCallback = callback;

          return _.isFunction(callback);
        }));

        joinCallback(event).then(() => {
          done(new Error('Should not be called'));
        }, err => {
          expect(err.message).to.equals(error.message);
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(messenger.memberHasBeenAdded).to.not.have.been.called;
          done();
        });
      });

      it('should not call messenger.memberHasBeenAdded if getConversation can not be found', function(done) {
        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback();
        });

        adapter.bindEvents(messenger);

        expect(conversationMemberAddedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          joinCallback = callback;

          return _.isFunction(callback);
        }));

        joinCallback(event).then(() => {
          done(new Error('Should not be called'));
        }, err => {
          expect(err.message).to.match(/Can not find conversation/);
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(messenger.memberHasBeenAdded).to.not.have.been.called;
          done();
        });
      });

      it('should call messenger.memberHasBeenAdded', function(done) {
        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback(null, conversation);
        });

        adapter.bindEvents(messenger);

        expect(conversationMemberAddedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          joinCallback = callback;

          return _.isFunction(callback);
        }));

        joinCallback(event).then(() => {
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(messenger.memberHasBeenAdded).to.have.been.calledWith(conversation, member, authorMember);
          done();
        }, done);
      });
    });

    it('should subscribe to MEMBER_LEFT_CONVERSATION event', function() {
      adapter.bindEvents(messenger);

      expect(conversationRemoveMemberTopic.subscribe).to.have.been.calledWith(sinon.match.func);
    });

    describe('On MEMBER_LEFT_CONVERSATION event', function() {
      let count, member, event, leaveCallback;

      beforeEach(function() {
        event = {userId: user._id, conversationId: conversation._id};
        count = 10;
        member = {member: {id: user._id, objectType: 'user'}};
      });

      it('should not call messenger.memberHasLeft if getConversation fails', function(done) {
        const error = new Error('I failed to get conversation');

        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback(error);
        });

        adapter.bindEvents(messenger);

        expect(conversationRemoveMemberTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          leaveCallback = callback;

          return _.isFunction(callback);
        }));

        leaveCallback(event).then(() => {
          done(new Error('Should not be called'));
        }, err => {
          expect(err.message).to.equals(error.message);
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(messenger.memberHasLeft).to.not.have.been.called;
          done();
        });
      });

      it('should not call messenger.memberHasLeft if getConversation can not be found', function(done) {
        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback();
        });

        adapter.bindEvents(messenger);

        expect(conversationRemoveMemberTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          leaveCallback = callback;

          return _.isFunction(callback);
        }));

        leaveCallback(event).then(() => {
          done(new Error('Should not be called'));
        }, err => {
          expect(err.message).to.match(/Can not find conversation/);
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(messenger.memberHasLeft).to.not.have.been.called;
          done();
        });
      });

      it('should not call messenger.memberHasLeft if countMembers fails', function(done) {
        const error = new Error('I failed to count');

        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback(null, conversation);
        });

        lib.members.countMembers = sinon.spy(function() {
          return Q.reject(error);
        });

        adapter.bindEvents(messenger);

        expect(conversationRemoveMemberTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          leaveCallback = callback;

          return _.isFunction(callback);
        }));

        leaveCallback(event).then(() => {
          done(new Error('Should not be called'));
        }, err => {
          expect(err.message).to.match(/I failed to count/);
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(lib.members.countMembers).to.have.been.calledWith(conversation);
          expect(messenger.memberHasLeft).to.not.have.been.called;
          done();
        });
      });

      it('should call messenger.memberHasLeft', function(done) {
        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback(null, conversation);
        });

        lib.members.countMembers = sinon.spy(function() {
          return Q.when(count);
        });

        adapter.bindEvents(messenger);

        expect(conversationRemoveMemberTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
          leaveCallback = callback;

          return _.isFunction(callback);
        }));

        leaveCallback(event).then(() => {
          expect(lib.conversation.getById).to.have.been.calledWith(conversation._id);
          expect(lib.members.countMembers).to.have.been.calledWith(conversation);
          expect(messenger.memberHasLeft).to.have.been.calledWith(conversation, member, count);
          done();
        }, done);
      });
    });

    it('should subscribe to MESSAGE_RECEIVED event', function(done) {
      data = {message};
      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback(null, conversation);
      });
      adapter.bindEvents(messenger);

      expect(globalMessageReceivedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      process.nextTick(function() {
        expect(messenger.sendMessage).to.have.been.calledWith(conversation, data.message);
        done();
      });
    });

    it('should subscribe to MESSAGE_RECEIVED event but not call messenger when conversation.getById fails', function(done) {
      const error = new Error('I failed');

      data = {message};
      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback(error);
      });
      adapter.bindEvents(messenger);

      expect(globalMessageReceivedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      process.nextTick(function() {
        expect(messenger.sendMessage).to.not.have.been.called;
        expect(lib.conversation.getById).to.have.been.called;
        expect(logger.error).to.have.been.calledWith('Error while getting conversation to send message', error);
        done();
      });
    });

    it('should subscribe to MESSAGE_RECEIVED event but not call messenger when conversation.getById does not return conversation', function(done) {
      data = {message};
      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback();
      });
      adapter.bindEvents(messenger);

      expect(globalMessageReceivedTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      process.nextTick(function() {
        expect(messenger.sendMessage).to.not.have.been.called;
        expect(lib.conversation.getById).to.have.been.called;
        expect(logger.error).to.have.been.called;
        expect(logger.error.args[0][0]).to.equal('Error while getting conversation to send message');
        expect(logger.error.args[0][1].message).to.match(/Can not find conversation/);
        done();
      });
    });

    it('should publish a message in local pubsub on messenger "message" event', function() {
      data = {message};

      adapter.bindEvents(messenger);

      expect(messenger.on).to.have.been.calledWith('message', sinon.match.func.and(sinon.match(function(handler) {
        handler(data);
        expect(localMessageReceivedTopic.publish).to.have.been.calledWith({
          message: data
        });

        return true;
      })));
    });

    it('should subscribe to MEMBER_READ_CONVERSATION event', function() {
      data = {
        userId: 'user-id',
        conversationId: conversation._id,
        unreadMessageCount: 10
      };

      adapter.bindEvents(messenger);

      expect(setUserUnreadMessagesCountTopic.subscribe).to.have.been.calledWith(sinon.match(callback => {
        subscribeCallback = callback;

        return _.isFunction(callback);
      }));

      subscribeCallback(data);

      expect(messenger.sendDataToUser).to.have.been.calledWith(data.userId, MEMBER_READ_CONVERSATION, {
        conversationId: data.conversationId,
        unreadMessageCount: data.unreadMessageCount
      });
    });
  });
});
