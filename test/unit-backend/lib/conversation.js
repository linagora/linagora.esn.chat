'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var Q = require('q');

var CONSTANTS = require('../../../backend/lib/constants');
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
var CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;
var CONVERSATION_UPDATE = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATE;
var CHANNEL_DELETION = CONSTANTS.NOTIFICATIONS.CHANNEL_DELETION;
var TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
var ADD_MEMBERS_TO_CHANNEL = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
var MEMBERSHIP_EVENTS = CONSTANTS.NOTIFICATIONS.MEMBERSHIP_EVENTS;

describe('The linagora.esn.chat conversation lib', function() {

  let deps, lib, logger, channelCreationTopic, channelAddMember, membershipTopic, modelsMock, ObjectIdMock, mq, localChannelTopicUpdateTopic, channelTopicUpdateTopic, channelUpdateTopic, channelDeletionTopic, channelSavedTopic;

  function dependencies(name) {
    return deps[name];
  }

  beforeEach(function() {

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
        })
      }
    };

    ObjectIdMock = sinon.spy();

    deps = {
      logger: logger,
      db: {
        mongo: {
          mongoose: {
            model: function(type) {
              return modelsMock[type];
            },
            Types: {
              ObjectId: function() {
                return ObjectIdMock.apply(this, arguments);
              }
            }
          }
        }
      },
      pubsub: {
        local: {
          topic: function(name) {
            if (name === MEMBERSHIP_EVENTS) {
              return membershipTopic;
            }
            if (name === TOPIC_UPDATED) {
              return localChannelTopicUpdateTopic;
            }
            if (name === CHANNEL_SAVED) {
              return channelSavedTopic;
            }
          }
        },
        global: {
          topic: function(name) {
            if (name === CHANNEL_CREATION) {
              return channelCreationTopic;
            }
            if (name === TOPIC_UPDATED) {
              return channelTopicUpdateTopic;
            }
            if (name === ADD_MEMBERS_TO_CHANNEL) {
              return channelAddMember;
            }
            if (name === CONVERSATION_UPDATE) {
              return channelUpdateTopic;
            }
            if (name === CHANNEL_DELETION) {
              return channelDeletionTopic;
            }
          }
        }
      }
    };

    lib = {
      utils: require('../../../backend/lib/utils')(dependencies)
    };
  });

  describe('The getChannels function', function() {

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
      require('../../../backend/lib/conversation')(dependencies, lib).getChannels({}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({mode: CONVERSATION_MODE.CHANNEL, moderate: false});
        done();
      });
    });

    it('should return the default channel', function(done) {
      const module = require('../../../backend/lib/conversation')(dependencies, lib);

      module.getChannels({}, function(err, channels) {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({mode: CONVERSATION_MODE.CHANNEL, moderate: false});
        expect(err).to.be.equal(null);
        expect(channels).not.to.be.empty;
        expect(channels).not.to.be.undefined;
        expect(channels).to.be.an('Array');
        expect(channels[0]).to.shallowDeepEqual(CONSTANTS.DEFAULT_CHANNEL);
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

    it('should publish on the global CHANNEL_CREATION topic', function(done) {
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
});
