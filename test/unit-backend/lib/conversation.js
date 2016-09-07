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

  var deps, logger, channelCreationTopic, channelAddMember, modelsMock, ObjectIdMock, mq, channelTopicUpdateTopic, channelUpdateTopic, channelDeletionTopic;

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
  });

  describe('The getCommunityConversationByCommunityId', function() {
    it('should call ChatConversation.find with the correct param', function(done) {
      var id = 'id';
      var callback = 'callback';
      var exec = function(_callback_) {
        expect(modelsMock.ChatConversation.findOne).to.have.been.calledWith({
          type: CONVERSATION_TYPE.COMMUNITY,
          community: id
        });

        expect(populateMock).to.have.been.calledWith('members');

        expect(_callback_).to.be.equals(callback);
        done();
      };

      var populateMock = sinon.stub().returns({exec: exec});

      modelsMock.ChatConversation.findOne = sinon.stub().returns({populate: populateMock});

      require('../../../backend/lib/conversation')(dependencies).getCommunityConversationByCommunityId(id, callback);

    });
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
      require('../../../backend/lib/conversation')(dependencies).getChannels({}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.CHANNEL});
        expect(mq.populate).to.have.been.calledWith('members');
        done();
      });
    });

    it('should return the default channel', function(done) {
      var module = require('../../../backend/lib/conversation')(dependencies);
      module.getChannels({}, function(err, channels) {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.CHANNEL});
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

  describe('The getConversation function', function() {

    it('should call ChatConversation.findById', function(done) {
      var channelId = 1;
      require('../../../backend/lib/conversation')(dependencies).getConversation(channelId, function() {
        expect(modelsMock.ChatConversation.findById).to.have.been.calledWith(1);
        expect(mq.populate).to.have.been.calledWith('members');
        done();
      });
    });
  });

  describe('The createConversation function', function() {

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

      require('../../../backend/lib/conversation')(dependencies).createConversation(options, done);
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

      require('../../../backend/lib/conversation')(dependencies).createConversation({}, function() {
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

      require('../../../backend/lib/conversation')(dependencies).findConversation({type: type, exactMembersMatch: true, members: members}, function() {
        members.forEach(function(participant) {
          expect(ObjectIdMock).to.have.been.calledWith(participant);
        });

        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          type:  {$in: [type]},
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
      require('../../../backend/lib/conversation')(dependencies).findConversation({name: null}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          $or: [{name: {$exists: false}}, {name: null}]
        });

        expect(mq.populate).to.have.been.calledWith('members');
        expect(mq.populate).to.have.been.calledWith('last_message.creator');
        expect(mq.populate).to.have.been.calledWith('last_message.user_mentions');
        done();
      });
    });

    it('should call Channel.find with correct arguments when name is defined', function(done) {
      require('../../../backend/lib/conversation')(dependencies).findConversation({name: 'name'}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          name: 'name'
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

      require('../../../backend/lib/conversation')(dependencies).findConversation({type: type, members: members}, function() {
        members.forEach(function(participant) {
          expect(ObjectIdMock).to.have.been.calledWith(participant);
        });

        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          type:  {$in: [type]},
          members: {
            $all: [anObjectId]
          }
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

      require('../../../backend/lib/conversation')(dependencies).findConversation({type: [type, type2], members: members}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          type:  {$in: [type, type2]},
          members: {
            $all: [anObjectId]
          }
        });

        done();
      });
    });

    it('should handle no type', function(done) {
      var members = ['one'];
      var anObjectId = {};

      require('../../../backend/lib/conversation')(dependencies).findConversation({members: members}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          members: {
            $all: [anObjectId]
          }
        });

        done();
      });
    });

    it('should handle no members', function(done) {
      require('../../../backend/lib/conversation')(dependencies).findConversation({}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
        });

        done();
      });
    });

    it('should do not considere member when ignoreMemberFilterForChannel is true', function(done) {
      var members = ['one'];
      var anObjectId = {};

      require('../../../backend/lib/conversation')(dependencies).findConversation({ignoreMemberFilterForChannel: true, members: members}, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          $or: [{
            members: {
              $all: [anObjectId]
            }
          }, {
            type: CONVERSATION_TYPE.CHANNEL
          }]
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

      require('../../../backend/lib/conversation')(dependencies).addMemberToConversation(conversationId, userId, done);
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

      require('../../../backend/lib/conversation')(dependencies).addMemberToConversation(channelId, userId, done);
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

      require('../../../backend/lib/conversation')(dependencies).removeMemberFromConversation(channelId, userId, done);
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

      require('../../../backend/lib/conversation')(dependencies).removeMemberFromConversation(channelId, userId, done);
    });
  });

  describe('The createMessage function', function() {

    it('should call ChatMessage.save and populate correctly the creator and user_mentions', function(done) {
      var message = {id: 1, text: '', timestamps: {creation: '0405'}};
      function ChannelMessage(msg) {
        expect(msg).to.deep.equal(message);
      }
      ChannelMessage.prototype.save = function(cb) {
        message.toJSON = _.constant(message);
        cb(null, message, 0);
      };

      ChannelMessage.populate = sinon.spy(function(_message, data, cb) {
        expect(_message).to.equals(message);
        expect(data).to.deep.equals([{path: 'user_mentions'}, {path: 'creator'}]);
        cb(null, message);
      });

      modelsMock.ChatConversation.findByIdAndUpdate = function(id, options, cb) {
        cb(null, message);
      };

      modelsMock.ChatMessage = ChannelMessage;
      require('../../../backend/lib/conversation')(dependencies).createMessage(message, function(err, _message) {
        expect(err).to.be.null;
        expect(_message).to.equal(message);
        done();
      });
    });

    it('should parse user_mentions', function(done) {
      var id1 = '577d20f2d4afe0b119d4fd19';
      var id2 = '577d2106d4afe0b119d4fd1a';

      ObjectIdMock = sinon.spy(function(data) {
        this.id = data;
      });

      var message = {id: 1, text: 'This is a message with @' + id1 + ' and @' + id2};
      function ChannelMessage(msg) {
        expect(message.user_mentions).to.deep.equals([{id: id1}, {id: id2}]);
        expect(ObjectIdMock).to.have.been.calledWith(id1);
        expect(ObjectIdMock).to.have.been.calledWith(id2);
      }

      ChannelMessage.prototype.save = function(cb) {
        done();
      };

      modelsMock.ChatMessage = ChannelMessage;
      require('../../../backend/lib/conversation')(dependencies).createMessage(message);
    });

    it('should add the last message in the channel document and inc num of message and readed num of message for the author', function(done) {
      var channelId = 'channelId';
      var conversation = {_id: channelId, numOfMessage: 42};
      var message = {id: 1, creator: 'userId', channel: channelId, text: '', user_mentions: ['@userId'], timestamps: {creation: '0405'}};

      modelsMock.ChatMessage = function(msg) {
        expect(msg).to.be.deep.equal(message);
      };

      modelsMock.ChatMessage.prototype.save = function(cb) {
        message.toJSON = _.constant(message);
        cb(null, message, 0);
      };

      modelsMock.ChatMessage.populate = function(msg, _fields, cb) {
        cb(null, message);
      };

      modelsMock.ChatConversation.update = function(query, options, cb) {
        expect(query).to.deep.equal({_id: channelId});
        expect(options).to.deep.equal({
          $max: {'numOfReadedMessage.userId': conversation.numOfMessage}
        });
        cb(null, conversation);
      };

      modelsMock.ChatConversation.findByIdAndUpdate = function(id, options, cb) {
        expect(id).to.deep.equals(channelId);
        expect(options).to.deep.equals({
          $set: {last_message: {text: message.text, creator: message.creator, user_mentions: message.user_mentions, date: message.timestamps.creation}},
          $inc: {numOfMessage: 1}
        });
        modelsMock.ChatConversation.findByIdAndUpdate = function(id, options, cb) {
          cb();
        };
        cb(null, conversation);
      };

      require('../../../backend/lib/conversation')(dependencies).createMessage(message, function() {
        done();
      });
    });
  });

  describe('The getMessages function', function() {

    it('should call ChatMessage.find with the correct param and reverse the result', function(done) {
      var id = 1;
      var options = {_id: id};
      var limit = 2;
      var offset = 3;
      var query = {_id: 1, foo: 'bar', limit: limit, offset: offset};

      var populateMock = sinon.spy();
      var limitMock = sinon.spy();
      var skipMock = sinon.spy();
      var sortMock = sinon.spy();
      var result = [1, 2];

      modelsMock.ChatMessage = {
        find: function(q) {
          expect(q).to.deep.equal({channel: id});
          return {
            populate: populateMock,
            limit: limitMock,
            skip: skipMock,
            sort: sortMock,
            exec: function(callback) {
              expect(populateMock).to.have.been.calledWith('creator');
              expect(populateMock).to.have.been.calledWith('user_mentions');
              expect(limitMock).to.have.been.calledWith(limit);
              expect(skipMock).to.have.been.calledWith(offset);
              expect(sortMock).to.have.been.calledWith('-timestamps.creation');
              callback(null, result.slice(0).reverse());
            }
          };
        }
      };

      require('../../../backend/lib/conversation')(dependencies).getMessages(options, query, function(err, _result) {
        expect(err).to.be.null;
        expect(_result).to.be.deep.equal(result);
        done();
      });
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

      require('../../../backend/lib/conversation')(dependencies).updateTopic(channelId, topic, done);
    });
  });

  describe('The updateCommunityConversation function', function() {
    it('should update correctly the conversation', function(done) {
      var newConversation = {};
      var communityId = 'communityId';
      var modification = {newMembers: [1], deleteMembers: [2], title: 'title'};

      ObjectIdMock = sinon.spy(function(id) {
        this.id = id;
      });

      modelsMock.ChatConversation.findByIdAndUpdate = function(id, modification, callback) {
        callback(null, newConversation);
      };

      modelsMock.ChatConversation.findOneAndUpdate = function(id, modification, cb) {
        cb(null, newConversation);
        expect(modification).to.deep.equals({
          $addToSet: {
            members: {
              $each: [{id: 1}]
            }
          },
          $pullAll: {
            members: [{id: 2}]
          },
          $set: {name: 'title'}
        });
      };

      require('../../../backend/lib/conversation')(dependencies).updateCommunityConversation(communityId, modification, function(err, conv) {
        expect(conv).to.equal(newConversation);
        expect(err).to.be.null;
        done();
      });
    });
  });

  describe('The markAllMessageOfAConversationReaded function', function() {
    it('should set correctly the number of readed message by an user', function(done) {
      var channelId = 'channelId';
      var userId = 'userId';
      var numOfMessage = 42;

      modelsMock.ChatConversation.findOne = function(query, callback) {
        expect(query).to.deep.equals({_id: channelId});
        callback(null, {_id: channelId, numOfMessage: numOfMessage});
      };

      modelsMock.ChatConversation.update = function(query, options, callback) {
        expect(query).to.deep.equals({_id: channelId});
        expect(options).to.deep.equals({
          $max: {
            'numOfReadedMessage.userId': 42
          }
        });
        callback();
      };

      require('../../../backend/lib/conversation')(dependencies).makeAllMessageReadedForAnUser(userId, channelId, done);
    });
  });

  describe('The deleteConversation function', function() {
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

      require('../../../backend/lib/conversation')(dependencies).deleteConversation('userId', 'channelId', function() {
        expect(modelsMock.ChatConversation.findOneAndRemove).to.have.been.calledWith({_id: 'channelId', members: 'userId'});
        expect(modelsMock.ChatMessage.remove).to.have.been.calledWith({channel: 'channelId'});
        expect(channelDeletionTopic.publish).to.have.been.calledWith(deleteResult);
      });
    });
  });
});
