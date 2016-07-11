'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var CONSTANTS = require('../../../backend/lib/constants');
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
var TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
var _ = require('lodash');

describe('The linagora.esn.chat channel lib', function() {

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
      })
    };

    modelsMock = {
      ChatChannel: {
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

  describe('The getChannels function', function() {

    beforeEach(function() {
      modelsMock.ChatChannel = sinon.spy();
      modelsMock.ChatChannel.find = sinon.spy(function(options, cb) {
        cb && cb();
        return mq;
      });

      modelsMock.ChatChannel.prototype.save = function(cb) {
        cb(null, CONSTANTS.DEFAULT_CHANNEL, 1);
      };

      modelsMock.ChatChannel.populate = function(_channel, name, cb) {
        expect(name).to.equal('members');
        expect(_channel).to.equal(CONSTANTS.DEFAULT_CHANNEL);
        cb(null, _channel);
      };
    });

    it('should call ChatChannel.findById and populate members', function(done) {
      mq.exec = function(cb) {
        cb(null, {});
      };
      require('../../../backend/lib/channel')(dependencies).getChannels({}, function() {
        expect(modelsMock.ChatChannel.find).to.have.been.calledWith({type: 'channel'});
        expect(mq.populate).to.have.been.calledWith('members');
        done();
      });
    });

    it('should return the default channel', function(done) {
      var module = require('../../../backend/lib/channel')(dependencies);
      module.getChannels({}, function(err, channels) {
        expect(modelsMock.ChatChannel.find).to.have.been.calledWith({type: 'channel'});
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

  describe('The getChannel function', function() {

    it('should call ChatChannel.findById', function(done) {
      var channelId = 1;
      require('../../../backend/lib/channel')(dependencies).getChannel(channelId, function() {
        expect(modelsMock.ChatChannel.findById).to.have.been.calledWith(1);
        expect(mq.populate).to.have.been.calledWith('members');
        done();
      });
    });
  });

  describe('The createChannel function', function() {

    it('should call ChatChannel.save', function(done) {
      var options = {id: 1};
      function ChatChannel(opts) {
        expect(opts).to.deep.equal(options);
      }
      var channel = {};

      ChatChannel.prototype.save = function(cb) {
        cb(null, channel, 1);
      };

      ChatChannel.populate = function(_channel, name, cb) {
        expect(name).to.equal('members');
        expect(_channel).to.equal(channel);
        cb(null, channel);
      };

      modelsMock.ChatChannel = ChatChannel;

      require('../../../backend/lib/channel')(dependencies).createChannel(options, done);
    });

    it('should publish on the global CHANNEL_CREATION topic', function(done) {
      var channel = {
        isAChannel: true
      };

      function ChatChannel(opts) {
      }

      ChatChannel.prototype.save = function(cb) {
        cb(null, channel, 1);
      };

      ChatChannel.populate = function(_channel, name, cb) {
        cb(null, channel);
      };

      modelsMock.ChatChannel = ChatChannel;

      require('../../../backend/lib/channel')(dependencies).createChannel({}, function() {
        expect(channelCreationTopic.publish).to.have.been.calledWith({isAChannel: true});
        done();
      });
    });
  });

  describe('The findGroupByMembers function', function() {

    it('should call Channel.findwith correct parameters when exactMatch', function(done) {
      var members = ['one'];
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      require('../../../backend/lib/channel')(dependencies).findGroupByMembers(true, members, function() {
        members.forEach(function(participant) {
          expect(ObjectIdMock).to.have.been.calledWith(participant);
        });

        expect(modelsMock.ChatChannel.find).to.have.been.calledWith({
          type:  'group',
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

      require('../../../backend/lib/channel')(dependencies).findGroupByMembers(false, members, function() {
        members.forEach(function(participant) {
          expect(ObjectIdMock).to.have.been.calledWith(participant);
        });

        expect(modelsMock.ChatChannel.find).to.have.been.calledWith({
          type:  'group',
          members: {
            $all: [anObjectId]
          }
        });

        expect(mq.populate).to.have.been.calledWith('members');
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

      modelsMock.ChatChannel.update = function(query, options, cb) {
        expect(query).to.deep.equals({_id: channelId});
        expect(ObjectIdMock).to.have.been.calledWith(userId);
        expect(options).to.deep.equals({$addToSet: {members: anObjectId}});
        cb();
      };

      require('../../../backend/lib/channel')(dependencies).addMemberToChannel(channelId, userId, done);
    });
  });

  describe('The removeMembersFromChannel function', function() {
    it('should call Chanell.update with the correct parameter', function(done) {
      var channelId = 'channelId';
      var userId = 'userId';
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      modelsMock.ChatChannel.update = function(query, options, cb) {
        expect(query).to.deep.equals({_id: channelId});
        expect(ObjectIdMock).to.have.been.calledWith(userId);
        expect(options).to.deep.equals({$pull: {members: anObjectId}});
        cb();
      };

      require('../../../backend/lib/channel')(dependencies).removeMemberFromChannel(channelId, userId, done);
    });
  });

  describe('The createMessage function', function() {

    it('should call ChatMessage.save and populate correctly the creator and user_mentions', function(done) {
      var message = {id: 1, text: ''};
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

      modelsMock.ChatMessage = ChannelMessage;
      require('../../../backend/lib/channel')(dependencies).createMessage(message, function(err, _message) {
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
      require('../../../backend/lib/channel')(dependencies).createMessage(message);
    });
  });

  describe('The getMessages function', function() {

    it('should call ChatMessage.find', function(done) {
      var id = 1;
      var options = {_id: id};
      var limit = 2;
      var offset = 3;
      var query = {_id: 1, foo: 'bar', limit: limit, offset: offset};

      var populateMock = sinon.spy();
      var limitMock = sinon.spy();
      var skipMock = sinon.spy();
      var sortMock = sinon.spy();

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
              callback();
            }
          };
        }
      };

      require('../../../backend/lib/channel')(dependencies).getMessages(options, query, done);
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
      modelsMock.ChatChannel.findByIdAndUpdate = function(_channelId, _topic, cb) {
        expect(_channelId).to.deep.equals({_id: channelId});
        expect(_topic).to.deep.equals(setTopic);
        cb(null, {_id: channelId, topic: topic});
      };

      require('../../../backend/lib/channel')(dependencies).updateTopic(channelId, topic, done);
    });
  });
});
