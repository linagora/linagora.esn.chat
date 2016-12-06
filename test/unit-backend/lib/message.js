'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var CONSTANTS = require('../../../backend/lib/constants');
var CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
var CONVERSATION_UPDATE = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATE;
var CHANNEL_DELETION = CONSTANTS.NOTIFICATIONS.CHANNEL_DELETION;
var TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
var MESSAGE_SAVED = CONSTANTS.NOTIFICATIONS.MESSAGE_SAVED;
var ADD_MEMBERS_TO_CHANNEL = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
var _ = require('lodash');

describe('The linagora.esn.chat message lib', function() {

  var deps, logger, messageSavedTopic, channelCreationTopic, channelAddMember, modelsMock, ObjectIdMock, mq, channelTopicUpdateTopic, channelUpdateTopic, channelDeletionTopic;

  function dependencies(name) {
    return deps[name];
  }

  beforeEach(function() {

    messageSavedTopic = {
      publish: sinon.spy()
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

    channelUpdateTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    channelDeletionTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    logger = {
      /*eslint no-console: ["error", { allow: ["log"] }] */
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
            if (name === MESSAGE_SAVED) {
              return messageSavedTopic;
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
  });

  describe('The createMessage function', function() {

    it('should call ChatMessage.create and populate correctly the creator and user_mentions', function(done) {
      var message = {id: 1, text: '', timestamps: {creation: '0405'}};

      function ChannelMessage(msg) {
        expect(msg).to.deep.equal(message);
      }
      ChannelMessage.create = function(message, cb) {
        message.toJSON = _.constant(message);
        cb(null, message);
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
      require('../../../backend/lib/message')(dependencies).create(message, function(err, _message) {
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

      function ChannelMessage() {
      }

      ChannelMessage.create = function(message) {
        expect(message.user_mentions).to.deep.equals([{id: id1}, {id: id2}]);
        expect(ObjectIdMock).to.have.been.calledWith(id1);
        expect(ObjectIdMock).to.have.been.calledWith(id2);
        done();
      };

      modelsMock.ChatMessage = ChannelMessage;
      require('../../../backend/lib/message')(dependencies).create(message);
    });

    it('should add the last message in the channel document and inc num of message and readed num of message for the author', function(done) {
      var channelId = 'channelId';
      var conversation = {_id: channelId, numOfMessage: 42};
      var message = {id: 1, creator: 'userId', channel: channelId, text: '', user_mentions: ['@userId'], timestamps: {creation: '0405'}};

      modelsMock.ChatMessage = function(msg) {
        expect(msg).to.be.deep.equal(message);
      };

      modelsMock.ChatMessage.create = function(message, cb) {
        message.toJSON = _.constant(message);
        cb(null, message);
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

      require('../../../backend/lib/message')(dependencies).create(message, function() {
        done();
      });
    });
  });

  describe('The getForConversation function', function() {

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
          expect(q).to.deep.equal({channel: id, moderate: false});

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

      require('../../../backend/lib/message')(dependencies).getForConversation(options, query, function(err, _result) {
        expect(err).to.be.null;
        expect(_result).to.be.deep.equal(result);
        done();
      });
    });

    it('should call ChatMessage.find with the before parameter', function(done) {
      var id = 1;
      var beforeId = 'beforeId';
      var beforeTimestamp = 'beforeTimestamp';
      var before = {_id: beforeId, timestamps: {creation: beforeTimestamp}};
      var options = {_id: id};
      var limit = 2;
      var offset = 3;
      var query = {_id: 1, foo: 'bar', limit: limit, offset: offset, before: beforeId};

      var populateMock = sinon.spy();
      var limitMock = sinon.spy();
      var skipMock = sinon.spy();
      var sortMock = sinon.spy();
      var whereMock = sinon.spy();
      var result = [1, 2];

      modelsMock.ChatMessage = {
        findById: function(id) {
          expect(id).to.equal(beforeId);

          return {
            exec: function(callback) {
              callback(null, before);
            }
          };
        },
        find: function(q) {
          expect(q).to.deep.equal({channel: id, moderate: false});

          return {
            populate: populateMock,
            limit: limitMock,
            skip: skipMock,
            sort: sortMock,
            where: whereMock,
            exec: function(callback) {
              expect(populateMock).to.have.been.calledWith('creator');
              expect(populateMock).to.have.been.calledWith('user_mentions');
              expect(limitMock).to.have.been.calledWith(limit);
              expect(skipMock).to.have.been.calledWith(offset);
              expect(sortMock).to.have.been.calledWith('-timestamps.creation');
              expect(whereMock).to.have.been.calledWith({'timestamps.creation': {$lt: beforeTimestamp}});
              callback(null, result.slice(0).reverse());
            }
          };
        }
      };

      require('../../../backend/lib/message')(dependencies).getForConversation(options, query, function(err, _result) {
        expect(err).to.be.null;
        expect(_result).to.be.deep.equal(result);
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

      require('../../../backend/lib/message')(dependencies).markAllAsReadById(userId, channelId, done);
    });
  });

});
