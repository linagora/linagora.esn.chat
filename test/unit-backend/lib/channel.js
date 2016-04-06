'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;

describe('The linagora.esn.chat channel lib', function() {

  var deps;
  var logger = {
    error: console.log,
    info: console.log,
    debug: console.log
  };

  var dependencies = function(name) {
    return deps[name];
  };

  var modelsMock;

  var ObjectIdMock;

  beforeEach(function() {
    modelsMock = {
      ChatChannel: {
        find: function(cb) {
          cb();
        }
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
      }
    };
  });

  describe('The getChannels function', function() {

    it('should call ChatChannel.find', function(done) {
      require('../../../backend/lib/channel')(dependencies).getChannels({}, done);
    });
  });

  describe('The getChannel function', function() {

    it('should call ChatChannel.findById', function(done) {
      var channel = 1;
      modelsMock.ChatChannel.findById = function(channel, cb) {
        expect(channel).to.equal(channel);
        cb();
      };

      require('../../../backend/lib/channel')(dependencies).getChannel(channel, done);
    });
  });

  describe('The createChannel function', function() {

    it('should call ChatChannel.save', function(done) {
      var options = {id: 1};
      function ChatChannel(opts) {
        expect(opts).to.deep.equal(options);
      }
      ChatChannel.prototype.save = function(cb) {
        cb();
      };

      modelsMock.ChatChannel = ChatChannel;

      require('../../../backend/lib/channel')(dependencies).createChannel(options, done);
    });
  });

  describe('The findGroupByMembers function', function() {

    it('should call Channel.findOne with correct parameters when exactMatch', function(done) {
      var members = ['one'];
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      modelsMock.ChatChannel.findOne = function(options, cb) {
        members.forEach(function(participant) {
          expect(ObjectIdMock).to.have.been.calledWith(participant);
        });

        expect(options).to.deep.equals({
          type:  'group',
          members: {
            $all: [anObjectId],
            $size: 1
          }
        });

        cb();
      };

      require('../../../backend/lib/channel')(dependencies).findGroupByMembers(true, members, done);
    });

    it('should call Channel.findOne with correct parameters when not exactMatch', function(done) {
      var members = ['one'];
      var anObjectId = {};
      ObjectIdMock = sinon.stub().returns(anObjectId);

      modelsMock.ChatChannel.findOne = function(options, cb) {
        members.forEach(function(participant) {
          expect(ObjectIdMock).to.have.been.calledWith(participant);
        });

        expect(options).to.deep.equals({
          type:  'group',
          members: {
            $all: [anObjectId]
          }
        });

        cb();
      };

      require('../../../backend/lib/channel')(dependencies).findGroupByMembers(false, members, done);
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

    it('should call ChatMessage.save', function(done) {
      var message = {id: 1};
      function ChannelMessage(msg) {
        expect(msg).to.deep.equal(message);
      }
      ChannelMessage.prototype.save = function(cb) {
        cb();
      };

      modelsMock.ChatMessage = ChannelMessage;
      require('../../../backend/lib/channel')(dependencies).createMessage(message, done);
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
});
