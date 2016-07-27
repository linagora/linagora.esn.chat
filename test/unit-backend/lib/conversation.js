'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var CONSTANTS = require('../../../backend/lib/constants');
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
var CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
var TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
var _ = require('lodash');

describe('The linagora.esn.chat conversation lib', function() {

  var deps, logger, channelCreationTopic, modelsMock, ObjectIdMock, mq, channelTopicUptated;

  function dependencies(name) {
    return deps[name];
  }

  beforeEach(function() {

    channelCreationTopic = {
      publish: sinon.spy()
    };

    channelTopicUptated = {
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
              return channelTopicUptated;
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

    it('should call Channel.findwith correct parameters when exactMatch', function(done) {
      var members = ['one'];
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      require('../../../backend/lib/conversation')(dependencies).findConversationByTypeAndByMembers(type, false, true, members, function() {
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
        done();
      });
    });

    it('should call Channel.find with correct parameters when not exactMatch', function(done) {
      var members = ['one'];
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      require('../../../backend/lib/conversation')(dependencies).findConversationByTypeAndByMembers(type, false, false, members, function() {
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
        done();
      });
    });

    it('should also handle more than one type', function(done) {
      var members = ['one'];
      var anObjectId = {};
      var type2 = 'type2';

      require('../../../backend/lib/conversation')(dependencies).findConversationByTypeAndByMembers([type, type2], false, false, members, function() {
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

      require('../../../backend/lib/conversation')(dependencies).findConversationByTypeAndByMembers(null, false, false, members, function() {
        expect(modelsMock.ChatConversation.find).to.have.been.calledWith({
          members: {
            $all: [anObjectId]
          }
        });

        done();
      });
    });

    it('should do not considere member when ignoreMemberFilterForChannel is true', function(done) {
      var members = ['one'];
      var anObjectId = {};

      require('../../../backend/lib/conversation')(dependencies).findConversationByTypeAndByMembers(null, true, false, members, function() {
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

  describe('The addMembersToChannel function', function() {
    it('should call Chanell.update with the correct parameter', function(done) {
      var channelId = 'channelId';
      var userId = 'userId';
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      modelsMock.ChatConversation.update = function(query, options, cb) {
        expect(query).to.deep.equals({_id: channelId});
        expect(ObjectIdMock).to.have.been.calledWith(userId);
        expect(options).to.deep.equals({$addToSet: {members: anObjectId}});
        cb();
      };

      require('../../../backend/lib/conversation')(dependencies).addMemberToConversation(channelId, userId, done);
    });
  });

  describe('The removeMembersFromChannel function', function() {
    it('should call Chanell.update with the correct parameter', function(done) {
      var channelId = 'channelId';
      var userId = 'userId';
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      modelsMock.ChatConversation.update = function(query, options, cb) {
        expect(query).to.deep.equals({_id: channelId});
        expect(ObjectIdMock).to.have.been.calledWith(userId);
        expect(options).to.deep.equals({$pull: {members: anObjectId}});
        cb();
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

      modelsMock.ChatConversation.update = function(query, options, cb) {
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

    it('should add the last message in the channel document', function(done) {
      var channelId = 'channelId';
      var message = {id: 1, channel: channelId, text: '', timestamps: {creation: '0405'}};

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
        expect(query).to.deep.equals({_id: channelId});
        expect(options).to.deep.equals({$set: {last_message: {text: message.text, date: message.timestamps.creation}}});
        cb(null, message);
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
});
