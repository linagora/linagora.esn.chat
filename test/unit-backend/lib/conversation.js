'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var CONSTANTS = require('../../../backend/lib/constants');
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
var CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
var CONVERSATION_UPDATE = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATE;
var CHANNEL_DELETION = CONSTANTS.NOTIFICATIONS.CHANNEL_DELETION;
var TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
var ADD_MEMBERS_TO_CHANNEL = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
var _ = require('lodash');

describe('The linagora.esn.chat conversation lib', function() {

  var deps, lib, logger, channelCreationTopic, channelAddMember, modelsMock, ObjectIdMock, mq, channelTopicUpdateTopic, channelUpdateTopic, channelDeletionTopic;

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

    channelUpdateTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    channelDeletionTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    logger = {
      error: console.log,
      info: console.log,
      debug: console.log
    };

    mq = {
      populate: sinon.spy(function() {
        return mq;
      }),
      exec: sinon.spy(function(cb) {
        cb();
      }),
      sort: sinon.spy(function(type, cb) {
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

      modelsMock.ChatConversation.prototype.save = function(cb) {
        cb(null, CONSTANTS.DEFAULT_CHANNEL, 1);
      };

      modelsMock.ChatConversation.populate = function(_channel, name, cb) {
        expect(name).to.equal('members');
        expect(_channel).to.equal(CONSTANTS.DEFAULT_CHANNEL);
        cb(null, _channel);
      };
    });

    it('should call ChatConversation.findById and populate members', function(done) {
      mq.exec = function(cb) {
        cb(null, {});
      };
      require('../../../backend/lib/conversation')(dependencies, lib).getChannels({}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.CHANNEL, moderate: false});
        expect(mq.populate).to.have.been.calledWith('members');
        done();
      });
    });

    it('should return the default channel', function(done) {
      var module = require('../../../backend/lib/conversation')(dependencies, lib);
      module.getChannels({}, function(err, channels) {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.CHANNEL, moderate: false});
        expect(mq.populate).to.have.been.calledWith('members');
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
      var channelId = 1;
      require('../../../backend/lib/conversation')(dependencies, lib).getById(channelId, function() {
        expect(modelsMock.ChatConversation.findById).to.have.been.calledWith(1);
        expect(mq.populate).to.have.been.calledWith('members');
        done();
      });
    });
  });

  describe('The create function', function() {

    it('should call ChatConversation.save', function(done) {
      var options = {id: 1};
      function ChatConversation(opts) {
        expect(opts).to.deep.equal(options);
      }
      var channel = {};

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
      var channel = {
        isAChannel: true
      };

      function ChatConversation(opts) {
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

  describe('The findConversationByTypeAndByMembers function', function() {
    var type;

    beforeEach(function() {
      type = 'type';
    });

    it('should call Channel.find with correct parameters when exactMatch', function(done) {
      var members = ['one'];
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      require('../../../backend/lib/conversation')(dependencies, lib).find({type: type, exactMembersMatch: true, members: members}, function() {
        members.forEach(function(participant) {
          expect(ObjectIdMock).to.have.been.calledWith(participant);
        });

        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          type:  {$in: [type]},
          moderate: false,
          members: {
            $all: [anObjectId],
            $size: 1
          }
        });

        expect(mq.populate).to.have.been.calledWith('members');
        expect(mq.populate).to.have.been.calledWith('last_message.creator');
        expect(mq.populate).to.have.been.calledWith('last_message.user_mentions');
        done();
      });
    });

    it('should call Channel.find with correct arguments when name is null', function(done) {
      require('../../../backend/lib/conversation')(dependencies, lib).find({name: null}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          $or: [{name: {$exists: false}}, {name: null}],
          moderate: false
        });

        expect(mq.populate).to.have.been.calledWith('members');
        expect(mq.populate).to.have.been.calledWith('last_message.creator');
        expect(mq.populate).to.have.been.calledWith('last_message.user_mentions');
        done();
      });
    });

    it('should call Channel.find with correct arguments when name is defined', function(done) {
      require('../../../backend/lib/conversation')(dependencies, lib).find({name: 'name'}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          name: 'name',
          moderate: false
        });

        expect(mq.populate).to.have.been.calledWith('members');
        expect(mq.populate).to.have.been.calledWith('last_message.creator');
        expect(mq.populate).to.have.been.calledWith('last_message.user_mentions');
        done();
      });
    });

    it('should call Channel.find with correct parameters when not exactMatch', function(done) {
      var members = ['one'];
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      require('../../../backend/lib/conversation')(dependencies, lib).find({type: type, members: members}, function() {
        members.forEach(function(participant) {
          expect(ObjectIdMock).to.have.been.calledWith(participant);
        });

        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          type:  {$in: [type]},
          members: {
            $all: [anObjectId]
          },
          moderate: false
        });

        expect(mq.populate).to.have.been.calledWith('members');
        expect(mq.populate).to.have.been.calledWith('last_message.creator');
        expect(mq.populate).to.have.been.calledWith('last_message.user_mentions');
        done();
      });
    });

    it('should also handle more than one type', function(done) {
      var members = ['one'];
      var anObjectId = {};
      var type2 = 'type2';

      require('../../../backend/lib/conversation')(dependencies, lib).find({type: [type, type2], members: members}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          type:  {$in: [type, type2]},
          members: {
            $all: [anObjectId]
          },
          moderate: false
        });

        done();
      });
    });

    it('should handle no type', function(done) {
      var members = ['one'];
      var anObjectId = {};

      require('../../../backend/lib/conversation')(dependencies, lib).find({members: members}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          members: {
            $all: [anObjectId]
          },
          moderate: false
        });

        done();
      });
    });

    it('should handle no members', function(done) {
      require('../../../backend/lib/conversation')(dependencies, lib).find({}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          moderate: false,
        });

        done();
      });
    });

    it('should do not considere member when ignoreMemberFilterForChannel is true', function(done) {
      var members = ['one'];
      var anObjectId = {};

      require('../../../backend/lib/conversation')(dependencies, lib).find({ignoreMemberFilterForChannel: true, members: members}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          $or: [{
            members: {
              $all: [anObjectId]
            }
          }, {
            type: CONVERSATION_TYPE.CHANNEL
          }],
          moderate: false
        });

        done();
      });
    });
  });

  describe('The addMembersToConversation function', function() {
    it('should call ChatConversation.findByIdAndUpdate with the correct parameter', function(done) {
      var conversationId = 'channelId';
      var userId = 'userId';
      var anObjectId = {};
      ObjectIdMock = sinon.spy(function(id) {
        this.id;
      });

      modelsMock.ChatConversation.findByIdAndUpdate = function(id, options, cb) {
        expect(id).to.equals(conversationId);
        expect(ObjectIdMock).to.have.been.calledWith(userId);
        expect(options).to.deep.equals({$addToSet: {members: anObjectId}});
        modelsMock.ChatConversation.findByIdAndUpdate = function(id, options, cb) {
          cb();
        };
        cb(null, {numOfMessage: 42});
      };

      require('../../../backend/lib/conversation')(dependencies, lib).addMember(conversationId, userId, done);
    });

    it('should set the number of readed message of the current user correctly', function(done) {
      var channelId = 'channelId';
      var userId = 'userId';
      var anObjectId = {};
      var numOfMessage = 42;
      ObjectIdMock = sinon.stub().returns(anObjectId);

      modelsMock.ChatConversation.findByIdAndUpdate = function(id, options, cb) {
        cb(null, {numOfMessage: numOfMessage, _id: channelId});
      };

      modelsMock.ChatConversation.update = function(query, options, cb) {
        expect(query).to.deep.equals({_id: channelId});
        expect(options).to.deep.equals({
          $max: {'numOfReadedMessage.userId': numOfMessage}
        });
        cb();
      };

      require('../../../backend/lib/conversation')(dependencies, lib).addMember(channelId, userId, done);
    });
  });

  describe('The removeMembersFromChannel function', function() {
    it('should call Channel.update with the correct parameter', function(done) {
      var channelId = 'channelId';
      var userId = 'userId';
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      modelsMock.ChatConversation.update = function(query, options, cb) {
        expect(query).to.deep.equals({_id: channelId});
        expect(ObjectIdMock).to.have.been.calledWith(userId);
        expect(options).to.deep.equals({
          $pull: {members: anObjectId},
          $unset: {
            'numOfReadedMessage.userId': ''
          }
        });
        cb();
      };

      require('../../../backend/lib/conversation')(dependencies, lib).removeMember(channelId, userId, done);
    });

    it('should publish the channel modification', function(done) {
      var channelId = 'channelId';
      var userId = 'userId';
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      modelsMock.ChatConversation.update = function(query, options, cb) {
        var conversation = 'conversation';
        cb(null, conversation);
        expect(channelUpdateTopic).to.have.been.calledWith({
          conversation: conversation,
          deleteMembers: [{_id: userId}]
        });
      };

      require('../../../backend/lib/conversation')(dependencies, lib).removeMember(channelId, userId, done);
    });
  });

  describe('The updateTopic function', function() {
    it('should call Channel.findByIdAndUpdate with the correct parameter', function(done) {
      var now = new Date();
      var clock = sinon.useFakeTimers(now.getTime());
      var channelId = {
        _id: 'channelId',
        toHexString: function() {
          return this._id;
        }
      };
      var userId = {
        _id: 'userId',
        toHexString: function() {
          return this._id;
        }
      };
      var topic = {
        value: 'value',
        creator: userId,
        last_set: new Date(clock.now)
      };
      var setTopic = {$set: {
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

  describe('The remove function', function() {
    it('should delete the conversation and its messages', function() {
      var deleteResult = {_id: 'channelId'};
      modelsMock.ChatConversation.findOneAndRemove = sinon.spy(function(query, cb) {
        cb(null, deleteResult);
      });
      modelsMock.ChatMessage = {
        remove: sinon.spy(function(query, cb) {
          cb();
        })
      };

      require('../../../backend/lib/conversation')(dependencies, lib).remove('userId', 'channelId', function() {
        expect(modelsMock.ChatConversation.findOneAndRemove).to.have.been.calledWith({_id: 'channelId', members: 'userId'});
        expect(modelsMock.ChatMessage.remove).to.have.been.calledWith({channel: 'channelId'});
        expect(channelDeletionTopic.publish).to.have.been.calledWith(deleteResult);
      });
    });
  });
});
