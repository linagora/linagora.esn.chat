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
      utils: require('../../../backend/lib/utils')(dependencies),
      conversation: {
        makeAllMessageReadedForAnUserHelper: function(user, conversation, callback) {
          callback(null, conversation);
        }
      }
    };
  });

  describe('The getCommunityConversationByCommunityId', function() {
    it('should call ChatConversation.find with the correct param', function(done) {
      var id = 'id';
      var callback = 'callback';
      var populateMock;

      var exec = function(_callback_) {
        expect(modelsMock.ChatConversation.findOne).to.have.been.calledWith({
          type: CONVERSATION_TYPE.COMMUNITY,
          community: id
        });

        expect(populateMock).to.have.been.calledWith('members');

        expect(_callback_).to.be.equals(callback);
        done();
      };

      populateMock = sinon.stub().returns({exec: exec});
      modelsMock.ChatConversation.findOne = sinon.stub().returns({populate: populateMock});

      require('../../../backend/lib/community')(dependencies, lib).getCommunityConversationByCommunityId(id, callback);

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

      require('../../../backend/lib/community')(dependencies, lib).updateCommunityConversation(communityId, modification, function(err, conv) {
        expect(conv).to.equal(newConversation);
        expect(err).to.be.null;
        done();
      });
    });
  });

});
