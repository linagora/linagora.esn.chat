'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const Q = require('q');

const CONSTANTS = require('../../../backend/lib/constants');
const CONVERSATION_ARCHIVED = CONSTANTS.NOTIFICATIONS.CONVERSATION_ARCHIVED;
const CONVERSATION_CREATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_CREATED;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATED;
const CONVERSATION_DELETED = CONSTANTS.NOTIFICATIONS.CONVERSATION_DELETED;
const CONVERSATION_SAVED = CONSTANTS.NOTIFICATIONS.CONVERSATION_SAVED;
const CONVERSATION_TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.CONVERSATION_TOPIC_UPDATED;
const MEMBER_ADDED_IN_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
const MEMBERSHIP_EVENTS = CONSTANTS.NOTIFICATIONS.MEMBERSHIP_EVENTS;
const MEMBER_READ_CONVERSATION = CONSTANTS.NOTIFICATIONS.MEMBER_READ_CONVERSATION;

describe('The linagora.esn.chat conversation lib', function() {

  let deps, lib, logger, channelArchivedLocalTopic, channelCreationTopic, channelAddMember, membershipTopic, modelsMock, ObjectId, mq, localChannelTopicUpdateTopic, channelTopicUpdateTopic, channelUpdateTopic, channelDeletionTopic, channelSavedTopic, memberHasRead;

  function dependencies(name) {
    return deps[name];
  }

  beforeEach(function() {

    channelArchivedLocalTopic = {
      forward: sinon.spy()
    };

    channelCreationTopic = {
      publish: sinon.spy()
    };

    channelAddMember = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    channelTopicUpdateTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    localChannelTopicUpdateTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    channelUpdateTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    channelDeletionTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    channelSavedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    membershipTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    memberHasRead = {
      publish: sinon.spy()
    };

    logger = {
      /*eslint no-console: ["error", { allow: ["log"] }] */
      error: console.log,
      info: console.log,
      debug: console.log,
      warn: console.log
    };

    mq = {
      populate: sinon.spy(function() {
        return mq;
      }),
      exec: sinon.spy(function(cb) {
        cb();
      }),
      sort: sinon.spy(function() {
        return mq;
      })
    };

    modelsMock = {
      ChatConversation: {
        find: sinon.spy(function(options, cb) {
          cb && cb();

          return mq;
        }),
        findById: sinon.spy(function(options, cb) {
          cb && cb();

          return mq;
        }),
        findByIdAndRemove: sinon.spy(function(channel, cb) {
          cb();
        }),
        findByIdAndUpdate: sinon.spy(function(id, action, cb) {
          cb && cb(null, mq);

          return mq;
        }),
        findOneAndUpdate: sinon.spy(function(query, action, cb) {
          cb && cb(null, mq);

          return mq;
        }),
        update: sinon.spy(function(query, action, cb) {
          cb && cb(null, mq);
        }),
        remove: sinon.spy(function() {
          return Q.when();
        })
      }
    };

    ObjectId = require('mongoose').Types.ObjectId;

    deps = {
      logger: logger,
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
          topic: function(name) {
            if (name === CONVERSATION_ARCHIVED) {
              return channelArchivedLocalTopic;
            }
            if (name === MEMBERSHIP_EVENTS) {
              return membershipTopic;
            }
            if (name === CONVERSATION_TOPIC_UPDATED) {
              return localChannelTopicUpdateTopic;
            }
            if (name === CONVERSATION_SAVED) {
              return channelSavedTopic;
            }
          }
        },
        global: {
          topic: function(name) {
            if (name === CONVERSATION_CREATED) {
              return channelCreationTopic;
            }
            if (name === CONVERSATION_TOPIC_UPDATED) {
              return channelTopicUpdateTopic;
            }
            if (name === MEMBER_ADDED_IN_CONVERSATION) {
              return channelAddMember;
            }
            if (name === CONVERSATION_UPDATED) {
              return channelUpdateTopic;
            }
            if (name === CONVERSATION_DELETED) {
              return channelDeletionTopic;
            }
            if (name === MEMBER_READ_CONVERSATION) {
              return memberHasRead;
            }
          }
        }
      }
    };

    lib = {
      utils: require('../../../backend/lib/utils')(dependencies)
    };
  });

  describe('The createDefaultChannel function', function() {
    let options, mongoOptions, conversation, query;

    beforeEach(function() {
      options = {domainId: 1};
      conversation = {_id: 2};
      mongoOptions = { new: true, upsert: true, setDefaultsOnInsert: true, passRawResult: true };
      query = { domain_ids: [options.domainId], name: CONSTANTS.DEFAULT_CHANNEL.name, type: CONSTANTS.DEFAULT_CHANNEL.type, mode: CONSTANTS.DEFAULT_CHANNEL.mode };
      modelsMock.ChatConversation = sinon.spy();
    });

    it('should not publish conversation when findOneAndUpdate fails', function(done) {
      const error = new Error('I failed to find');

      modelsMock.ChatConversation.findOneAndUpdate = sinon.spy(function(query, update, options, cb) {
        cb(error);
      });

      require('../../../backend/lib/conversation')(dependencies, lib).createDefaultChannel(options, function(err) {
        expect(modelsMock.ChatConversation.findOneAndUpdate).to.have.been.calledWith(query, query, mongoOptions);
        expect(err.message).to.equals(error.message);
        done();
      });
    });

    it('should publish conversation when it has been created', function(done) {
      const raw = {
        lastErrorObject: {
          updatedExisting: false
        }
      };

      modelsMock.ChatConversation.findOneAndUpdate = sinon.spy(function(query, update, options, cb) {
        cb(null, conversation, raw);
      });

      require('../../../backend/lib/conversation')(dependencies, lib).createDefaultChannel(options, function(err, result) {
        expect(err).to.not.be.defined;
        expect(result).to.equals(conversation);
        expect(modelsMock.ChatConversation.findOneAndUpdate).to.have.been.calledWith(query, query, mongoOptions);
        expect(channelCreationTopic.publish).to.have.been.calledWith(JSON.parse(JSON.stringify(conversation)));
        expect(channelSavedTopic.publish).to.have.been.calledWith(conversation);
        done();
      });
    });

    it('should not publish conversation when it has not been created', function(done) {
      const raw = {
        lastErrorObject: {
          updatedExisting: true
        }
      };

      modelsMock.ChatConversation.findOneAndUpdate = sinon.spy(function(query, update, options, cb) {
        cb(null, conversation, raw);
      });

      require('../../../backend/lib/conversation')(dependencies, lib).createDefaultChannel(options, function(err, result) {
        expect(err).to.not.be.defined;
        expect(result).to.equals(conversation);
        expect(modelsMock.ChatConversation.findOneAndUpdate).to.have.been.calledWith(query, query, mongoOptions);
        expect(channelCreationTopic.publish).to.not.have.been.called;
        expect(channelSavedTopic.publish).to.not.have.been.called;
        done();
      });
    });
  });

  describe('The archive function', function() {
    let conversation, user, conversationCore;

    beforeEach(function() {
      modelsMock.ChatArchivedConversation = sinon.spy();
      conversationCore = { _id: '123456789012304567891234', archived: {}};
      conversation = {toObject: function() { return conversationCore;}, _id: '123456789012304567891234', archived: {}};
      user = {_id: '123456789012304567891234'};

      modelsMock.ChatConversation.findById = sinon.spy(function() {
        return Q.when(conversation);
      });

      modelsMock.ChatConversation.remove = sinon.spy(function() {
        return Q.when();
      });

      modelsMock.ChatArchivedConversation = sinon.spy();
      modelsMock.ChatArchivedConversation.prototype.save = function() {

        return Q.when(conversationCore);
      };

    });

    it('should delete conversation after storing ArchivedConversation', function(done) {

      require('../../../backend/lib/conversation')(dependencies, lib).archive(conversation, user).then(function() {
        expect(modelsMock.ChatConversation.remove).to.be.called;
        expect(channelArchivedLocalTopic.forward).to.be.called;
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('should not delete conversation when storing ArchivedConversation fails', function(done) {
      const error = new Error('archive save fail');

      modelsMock.ChatArchivedConversation.prototype.save = sinon.spy(function() {

        return Q.reject(error);
      });
      require('../../../backend/lib/conversation')(dependencies, lib).archive(conversation, user).catch(err => {
        expect(modelsMock.ChatConversation.remove).to.not.have.been.called;
        expect(channelArchivedLocalTopic.forward).to.not.have.been.called;
        expect(err.message).to.be.equal(error.message);
        done();
      });
    });
  });

  describe('The find function', function() {
    it('should call Conversation.find with the correct populations parameter', function(done) {
      const options = {
        mode: CONVERSATION_MODE.CHANNEL,
        populations: { lastMessageCreator: true, lastMessageMentionedUsers: true }
      };

      require('../../../backend/lib/conversation')(dependencies, lib).find(options, () => {
        expect(mq.populate).to.have.been.calledWith([
          {
            path: 'last_message.creator',
            select: CONSTANTS.SKIP_FIELDS.USER
          },
          {
            path: 'last_message.user_mentions',
            select: CONSTANTS.SKIP_FIELDS.USER
          }
        ]);
        done();
      });
    });

    it('should call Conversation.find with the correct sort parameter', function(done) {
      const sort = 'foobar';
      const options = {
        mode: CONVERSATION_MODE.CHANNEL,
        sort
      };

      require('../../../backend/lib/conversation')(dependencies, lib).find(options, () => {
        expect(mq.sort).to.have.been.calledWith(sort);
        done();
      });
    });

    it('should call Conversation.find with the correct "unread" parameter', function(done) {
      const memberId1 = '589c6a2a53bf175bd6164386';
      const memberId2 = '589c6a2a53bf175bd6164387';
      const options = {
        mode: CONVERSATION_MODE.CHANNEL,
        members: [
          { member: { id: memberId1, objectType: CONSTANTS.OBJECT_TYPES.USER } },
          { member: { id: memberId2, objectType: CONSTANTS.OBJECT_TYPES.USER } }
        ],
        unread: true
      };

      require('../../../backend/lib/conversation')(dependencies, lib).find(options, () => {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          mode: CONVERSATION_MODE.CHANNEL,
          moderate: false,
          members: {
            $all: [
              { $elemMatch: { 'member.id': new ObjectId(memberId1), 'member.objectType': CONSTANTS.OBJECT_TYPES.USER } },
              { $elemMatch: { 'member.id': new ObjectId(memberId2), 'member.objectType': CONSTANTS.OBJECT_TYPES.USER } }
            ]
          },
          $where: `(!this.memberStates["${memberId1}"] || this.memberStates["${memberId1}"].numOfReadMessages < this.numOfMessage) && (!this.memberStates["${memberId2}"] || this.memberStates["${memberId2}"].numOfReadMessages < this.numOfMessage)`
        });
        done();
      });
    });
  });

  describe('The getOpenChannels function', function() {

    beforeEach(function() {
      modelsMock.ChatConversation = sinon.spy();
      modelsMock.ChatConversation.find = sinon.spy(function(options, cb) {
        cb && cb();

        return mq;
      });
      modelsMock.ChatConversation.findOneAndUpdate = sinon.spy(function(query, update, options, cb) {
        cb(null, CONSTANTS.DEFAULT_CHANNEL);
      });

      modelsMock.ChatConversation.prototype.save = function(cb) {
        cb(null, CONSTANTS.DEFAULT_CHANNEL, 1);
      };

      modelsMock.ChatConversation.populate = function(_channel, name, cb) {
        expect(name).to.equal('members');
        expect(_channel).to.equal(CONSTANTS.DEFAULT_CHANNEL);
        cb(null, _channel);
      };
    });

    it('should call ChatConversation.findById', function(done) {
      mq.exec = function(cb) {
        cb(null, {});
      };
      require('../../../backend/lib/conversation')(dependencies, lib).getOpenChannels({}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.OPEN, mode: CONVERSATION_MODE.CHANNEL, moderate: false});
        done();
      });
    });
  });

  describe('The getDefaultChannel function', function() {
    it('should call Conversation.findOne', function(done) {
      const options = {domainId: 1};

      modelsMock.ChatConversation.findOne = sinon.spy(function() {
        return {
          exec: function(cb) {
            cb();
          }
        };
      });

      require('../../../backend/lib/conversation')(dependencies, lib).getDefaultChannel(options, function() {
        expect(modelsMock.ChatConversation.findOne).to.have.been.calledWith(
          {domain_ids: [options.domainId], name: CONSTANTS.DEFAULT_CHANNEL.name, type: CONSTANTS.DEFAULT_CHANNEL.type, mode: CONSTANTS.DEFAULT_CHANNEL.mode}
        );
        done();
      });
    });
  });

  describe('The getById function', function() {

    it('should call ChatConversation.findById', function(done) {
      const channelId = 1;

      require('../../../backend/lib/conversation')(dependencies, lib).getById(channelId, function() {
        expect(modelsMock.ChatConversation.findById).to.have.been.calledWith(1);
        done();
      });
    });
  });

  describe('The create function', function() {

    it('should call ChatConversation.save', function(done) {
      const options = {id: 1};

      function ChatConversation(opts) {
        expect(opts).to.deep.equal(options);
      }
      const channel = {};

      ChatConversation.prototype.save = function(cb) {
        cb(null, channel, 1);
      };

      ChatConversation.populate = function(_channel, name, cb) {
        expect(name).to.equal('members');
        expect(_channel).to.equal(channel);
        cb(null, channel);
      };

      modelsMock.ChatConversation = ChatConversation;

      require('../../../backend/lib/conversation')(dependencies, lib).create(options, done);
    });

    it('should set member.id instance of mongo ObjectId if member.id is a String', function(done) {
      const options = {id: 1, members: [{member: {id: '589c6a2a53bf175bd6164386'}}]};

      function ChatConversation(opts) {
        expect(opts).to.deep.equal(options);
        expect(opts.members[0].member.id).to.be.instanceof(ObjectId);
      }

      const channel = {};

      ChatConversation.prototype.save = function(cb) {
        cb(null, channel, 1);
      };

      modelsMock.ChatConversation = ChatConversation;

      require('../../../backend/lib/conversation')(dependencies, lib).create(options, done);
    });

    it('should not change member.id if it already instance of mongo ObjectId', function(done) {
      const anObjectId = new ObjectId();
      const options = {id: 1, members: [{member: {id: anObjectId}}]};

      function ChatConversation(opts) {
        expect(opts).to.deep.equal(options);
        expect(opts.members[0].member.id).to.be.instanceof(ObjectId);

      }

      const channel = {};

      ChatConversation.prototype.save = function(cb) {
        cb(null, channel, 1);
      };

      modelsMock.ChatConversation = ChatConversation;

      require('../../../backend/lib/conversation')(dependencies, lib).create(options, done);
    });

    it('should set domain_ids instances of mongo ObjectId if domain_ids are String', function(done) {
      const options = {id: 1, domain_ids: ['589c6a2a53bf175bd6164386']};
      const channel = {};

      function ChatConversation(opts) {
        expect(opts).to.deep.equal(options);
        expect(opts.domain_ids[0]).to.be.instanceof(ObjectId);
      }

      ChatConversation.prototype.save = function(cb) {
        cb(null, channel, 1);
      };

      modelsMock.ChatConversation = ChatConversation;

      require('../../../backend/lib/conversation')(dependencies, lib).create(options, done);
    });

    it('should not change domain_ids if it already instances of mongo ObjectId', function(done) {
      const anObjectId = new ObjectId();
      const channel = {};
      const options = {id: 1, domain_ids: [anObjectId]};

      function ChatConversation(opts) {
        expect(opts).to.deep.equal(options);
        expect(opts.domain_ids[0]).to.be.instanceof(ObjectId);
      }

      ChatConversation.prototype.save = function(cb) {
        cb(null, channel, 1);
      };

      modelsMock.ChatConversation = ChatConversation;

      require('../../../backend/lib/conversation')(dependencies, lib).create(options, done);
    });

    it('should publish on the global CONVERSATION_CREATED topic', function(done) {
      const channel = {
        isAChannel: true
      };

      function ChatConversation() {
      }

      ChatConversation.prototype.save = function(cb) {
        cb(null, channel, 1);
      };

      ChatConversation.populate = function(_channel, name, cb) {
        cb(null, channel);
      };

      modelsMock.ChatConversation = ChatConversation;

      require('../../../backend/lib/conversation')(dependencies, lib).create({}, function() {
        expect(channelCreationTopic.publish).to.have.been.calledWith({isAChannel: true});
        done();
      });
    });
  });

  describe('The updateTopic function', function() {
    it('should call Channel.findByIdAndUpdate with the correct parameter', function(done) {
      const now = new Date();
      const clock = sinon.useFakeTimers(now.getTime());
      const channelId = {
        _id: 'channelId',
        toHexString: function() {
          return this._id;
        }
      };
      const userId = {
        _id: 'userId',
        toHexString: function() {
          return this._id;
        }
      };
      const topic = {
        value: 'value',
        creator: userId,
        last_set: new Date(clock.now)
      };
      const setTopic = {$set: {
          topic: topic
        }
      };

      modelsMock.ChatConversation.findByIdAndUpdate = function(_channelId, _topic, cb) {
        expect(_channelId).to.deep.equals({_id: channelId});
        expect(_topic).to.deep.equals(setTopic);
        cb(null, {_id: channelId, topic: topic});
      };

      require('../../../backend/lib/conversation')(dependencies, lib).updateTopic(channelId, topic, done);
    });
  });

  describe('The getAllForUser function', function() {
    it('should send back conversations from all the finders', function(done) {
      const user = {_id: 1};
      const options = {foo: 'bar'};
      const conversationLib = require('../../../backend/lib/conversation')(dependencies, lib);
      const finder1 = sinon.spy(function() {return Q.when([1, 2, 3]);});
      const finder2 = sinon.spy(function() {return Q.when([4, 5]);});

      conversationLib.registerUserConversationFinder(finder1);
      conversationLib.registerUserConversationFinder(finder2);
      conversationLib.getAllForUser(user, options).then(function(result) {
        expect(result.length).to.equals(5);
        expect(finder1).to.have.been.calledWith(user, options);
        expect(finder2).to.have.been.calledWith(user, options);
        done();
      });
    });

    it('should not fail when a finder fails', function(done) {
      const user = {_id: 1};
      const conversations = [1, 2, 3];
      const options = {foo: 'bar'};
      const conversationLib = require('../../../backend/lib/conversation')(dependencies, lib);
      const finder1 = sinon.spy(function() {return Q.when(conversations);});
      const finder2 = sinon.spy(function() {return Q.reject(new Error('I failed'));});

      conversationLib.registerUserConversationFinder(finder1);
      conversationLib.registerUserConversationFinder(finder2);
      conversationLib.getAllForUser(user, options).then(function(result) {
        expect(result).to.deep.equals(conversations);
        expect(finder1).to.have.been.calledWith(user, options);
        expect(finder2).to.have.been.calledWith(user, options);
        done();
      });
    });
  });

  describe('The markUserAsReadAllMessages function', function() {
    it('should call Conversation.findByIdAndUpdate with the correct parameter', function(done) {
      const conversation = {
        _id: 'conversationId',
        numOfMessage: 9001
      };
      const userId = 'userId';

      modelsMock.ChatConversation.findByIdAndUpdate = function(conversationId, update, cb) {
        expect(conversationId).to.equal(conversation._id);
        expect(update).to.deep.equals({
          [`memberStates.${userId}.numOfReadMessages`]: 9001,
          [`memberStates.${userId}.numOfUnseenMentions`]: 0
        });

        cb(null);
      };

      require('../../../backend/lib/conversation')(dependencies, lib).markUserAsReadAllMessages(userId, conversation, done);
    });

    it('should publish on MEMBER_READ_CONVERSATION topic', function(done) {
      const conversation = {
        _id: 'conversationId'
      };
      const userId = 'userId';

      modelsMock.ChatConversation.findByIdAndUpdate = (conversationId, update, cb) => {
        cb(null);
      };

      require('../../../backend/lib/conversation')(dependencies, lib).markUserAsReadAllMessages(userId, conversation, err => {
        if (err) {
          done(err);
        }

        expect(memberHasRead.publish).to.have.been.calledWith({
          userId,
          conversationId: conversation._id
        });
        done();
      });
    });
  });

  describe('The increaseNumberOfUnseenMentionsOfMembers function', function() {
    it('should call Conversation.findByIdAndUpdate with the correct parameter', function(done) {
      const conversationId = '123';
      const mentionmemberIds = ['memberId1', 'memberId2'];
      const expectedQuery = {
        $inc: {
          [`memberStates.${mentionmemberIds[0]}.numOfUnseenMentions`]: 1,
          [`memberStates.${mentionmemberIds[1]}.numOfUnseenMentions`]: 1
        }
      };

      modelsMock.ChatConversation.findByIdAndUpdate = sinon.stub().returns(Q.when());

      require('../../../backend/lib/conversation')(dependencies, lib).increaseNumberOfUnseenMentionsOfMembers(conversationId, mentionmemberIds)
        .then(() => {
          expect(modelsMock.ChatConversation.findByIdAndUpdate).to.have.been.calledWith(conversationId, expectedQuery);
          done();
        });
    });
  });
});
