'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const CONSTANTS = require('../../../backend/lib/constants');
const CHANNEL_CREATION = CONSTANTS.NOTIFICATIONS.CHANNEL_CREATION;
const CHANNEL_DELETION = CONSTANTS.NOTIFICATIONS.CHANNEL_DELETION;
const USER_STATE = CONSTANTS.NOTIFICATIONS.USER_STATE;
const TOPIC_UPDATED = CONSTANTS.NOTIFICATIONS.TOPIC_UPDATED;
const MESSAGE_RECEIVED = CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED;
const ADD_MEMBERS_TO_CHANNEL = CONSTANTS.NOTIFICATIONS.MEMBER_ADDED_IN_CONVERSATION;
const CONVERSATION_UPDATE = CONSTANTS.NOTIFICATIONS.CONVERSATION_UPDATE;
const _ = require('lodash');

describe('The Chat WS server', function() {

  var globalMessageReceivedTopic, channelAddMember, localMessageReceivedTopic, userStateTopic, logger, getUserId, getUserIdResult, chatNamespace, self, channelCreationTopic, channelDeletionTopic, channelTopicUptated, lib, conversationMock, getUserSocketsFromNamespaceMock, getUserSocketsFromNamespaceResponse, conversationUpdateProfile;

  function initWs() {
    return require('../../../backend/ws').init(self.moduleHelpers.dependencies, lib);
  }

  beforeEach(function() {
    self = this;
    getUserIdResult = null;
    localMessageReceivedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    globalMessageReceivedTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    userStateTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    channelCreationTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    channelDeletionTopic = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    channelTopicUptated = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    channelAddMember = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    conversationUpdateProfile = {
      subscribe: sinon.spy(),
      publish: sinon.spy()
    };

    logger = { info: sinon.spy(), warn: sinon.spy() };

    getUserId = sinon.spy(function() {
      return getUserIdResult;
    });

    chatNamespace = {
      on: sinon.spy(),
      emit: sinon.spy()
    };

    conversationMock = {
      getById: sinon.spy()
    };

    lib = {
      conversation: conversationMock
    };

    getUserSocketsFromNamespaceMock = sinon.spy(function() {
      return getUserSocketsFromNamespaceResponse;
    });

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
            if (name === USER_STATE) {
              return userStateTopic;
            }
            if (name === CHANNEL_CREATION) {
              return channelCreationTopic;
            }
            if (name === CHANNEL_DELETION) {
              return channelDeletionTopic;
            }
            if (name === TOPIC_UPDATED) {
              return channelTopicUptated;
            }
            if (name === MESSAGE_RECEIVED) {
              return globalMessageReceivedTopic;
            }
            if (name === ADD_MEMBERS_TO_CHANNEL) {
              return channelAddMember;
            }
            if (name === CONVERSATION_UPDATE) {
              return conversationUpdateProfile;
            }
          }
        }
      },
      logger: logger,
      wsserver: {
        ioHelper: {
          getUserId: getUserId,
          getUserSocketsFromNamespace: function() {
            return getUserSocketsFromNamespaceMock.apply(this, arguments);
          }
        },
        io: {
          of: function(name) {
            if (name === CONSTANTS.WEBSOCKET.NAMESPACE) {
              return chatNamespace;
            }
          }
        }
      }
    }, function(value, key) {
      self.moduleHelpers.addDep(key, value);
    });
  });

  it('should listen USER_STATE pubsub and emit it on ws', function() {
    initWs();
    var callbackOnUserStatePubsub;

    expect(userStateTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
      callbackOnUserStatePubsub = callback;

      return _.isFunction(callback);
    }));

    var data = {};

    callbackOnUserStatePubsub(data);
    expect(chatNamespace.emit).to.have.been.calledWith(USER_STATE, data);
  });

  it('should listen CREATION_CHANNEL pubsub and emit it on all the namespace if it is a channel', function() {
    initWs();
    var callbackOnCreationChannelPubsub;

    expect(channelCreationTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
      callbackOnCreationChannelPubsub = callback;

      return _.isFunction(callback);
    }));

    var data = {type: 'channel'};

    callbackOnCreationChannelPubsub(data);
    expect(chatNamespace.emit).to.have.been.calledWith(CHANNEL_CREATION, data);
  });

  it('should listen to CONVERSATION_UPDATE pubsub and emit the conversation to other member', function() {
    initWs();
    var callbackOnConversationUpdateTopic;
    var socketOne = {emit: sinon.spy()};
    var socketTwo = {emit: sinon.spy()};

    getUserSocketsFromNamespaceMock = function(data) {
      if (data === 'memberId') {
        return [socketOne];
      } else if (data === 'deleteId') {
        return [socketTwo];
      }
      throw new Error('Unexpected id');
    };

    getUserSocketsFromNamespaceResponse = [{emit: sinon.spy()}];
    expect(conversationUpdateProfile.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
      callbackOnConversationUpdateTopic = callback;

      return _.isFunction(callback);
    }));

    var data = {conversation: {type: 'collaboration', members: [{_id: 'memberId'}]}, deleteMembers: [{_id: 'deleteId'}]};

    callbackOnConversationUpdateTopic(data);
    expect(socketOne.emit).to.have.been.calledWith(CONVERSATION_UPDATE, data.conversation);
    expect(socketTwo.emit).to.have.been.calledWith(CHANNEL_DELETION, data.conversation);
  });

  it('should listen CHANNEL_CREATION pubsub and emit it only on his members if it is a group', function() {
    initWs();
    var callbackOnCreationChannelPubsub;

    getUserSocketsFromNamespaceResponse = [{emit: sinon.spy()}];
    expect(channelCreationTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
      callbackOnCreationChannelPubsub = callback;

      return _.isFunction(callback);
    }));

    var data = {type: 'private', members: [{_id: 'membersId'}]};

    callbackOnCreationChannelPubsub(data);
    expect(getUserSocketsFromNamespaceResponse[0].emit).to.have.been.calledWith(CHANNEL_CREATION, data);
  });

  it('should listen DELETION_CHANNEL pubsub and emit it only on his members if it is a group', function() {
    initWs();
    var callbackOnDeletionChannelPubsub;

    getUserSocketsFromNamespaceResponse = [{emit: sinon.spy()}];
    expect(channelDeletionTopic.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
      callbackOnDeletionChannelPubsub = callback;

      return _.isFunction(callback);
    }));

    var data = {type: 'private', members: [{_id: 'membersId'}]};

    callbackOnDeletionChannelPubsub(data);
    expect(getUserSocketsFromNamespaceResponse[0].emit).to.have.been.calledWith(CHANNEL_DELETION, data);
  });

  it('should listen TOPIC_UPDATED pubsub and emit it on ws', function() {
    initWs();
    var callbackOnTopicUpdatePubsub;

    expect(channelTopicUptated.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
      callbackOnTopicUpdatePubsub = callback;

      return _.isFunction(callback);
    }));

    var data = {};

    callbackOnTopicUpdatePubsub(data);
    expect(chatNamespace.emit).to.have.been.calledWith(TOPIC_UPDATED, data);
  });

  it('should listen ADD_MEMBERS_TO_CHANNEL pubsub and emit it on ws', function() {
    initWs();
    var memberAddedToChannelPubsub;

    expect(channelAddMember.subscribe).to.have.been.calledWith(sinon.match(function(callback) {
      memberAddedToChannelPubsub = callback;

      return _.isFunction(callback);
    }));

    var data = {};

    memberAddedToChannelPubsub(data);
    expect(chatNamespace.emit).to.have.been.calledWith(ADD_MEMBERS_TO_CHANNEL, data);
  });

  describe('The connexion handler', function() {
    var connectionHandler, socket;

    beforeEach(function() {
      getUserIdResult = 'userId';
      socket = {
        on: sinon.spy(),
        of: sinon.spy(),
        join: sinon.spy(),
        leave: sinon.spy()
      };

      initWs();

      expect(chatNamespace.on).to.have.been.calledWith('connection', sinon.match(function(handler) {
        connectionHandler = handler;

        return _.isFunction(handler);
      }));
    });

    it('should set on subscribe handler on the given socket', function() {
      connectionHandler(socket);
      expect(socket.on).to.have.been.calledWith('subscribe', sinon.match.func);
    });

    describe('The socket on handler', function() {
      var onSubscribeHandler, room;

      beforeEach(function() {
        room = 'room';
        connectionHandler(socket);
        expect(socket.on).to.have.been.calledWith('subscribe', sinon.match(function(callback) {
          onSubscribeHandler = callback;

          return _.isFunction(callback);
        }));
      });

      it('should put the socket in the given room', function() {
        onSubscribeHandler(room);
        expect(socket.join).to.have.been.calledWith(room);
      });

      it('should listen on message and publish same on local pubsub for received message', function() {
        onSubscribeHandler(room);
        expect(socket.on).to.have.been.calledWith('message', sinon.match.func.and(sinon.match(function(handler) {
          var data = {};

          handler(data);
          expect(localMessageReceivedTopic.publish).to.have.been.calledWith({
            room: room,
            message: data
          });

          return true;
        })));
      });

      it('should listen on message and send them to the all namespace if there are from the channel', function() {
        var messageReceptorHandler;

        onSubscribeHandler(room);
        expect(globalMessageReceivedTopic.subscribe).to.have.been.calledWith(sinon.match.func.and(sinon.match(function(handler) {
          messageReceptorHandler = handler;

          return true;
        })));

        var data = {channel: 'channelId'};
        var channel = {type: 'channel'};

        messageReceptorHandler({room: room, message: data});
        expect(conversationMock.getById).to.have.been.calledWith(data.channel, sinon.match.func.and(sinon.match(function(callback) {
          callback(null, channel);

          return true;
        })));

        expect(chatNamespace.emit).to.have.been.calledWith('message', {room: room, data: data});
      });

      it('should listen on message and send them only to members of the channel if the channel is a group', function() {
        var messageReceptorHandler;

        onSubscribeHandler(room);
        expect(globalMessageReceivedTopic.subscribe).to.have.been.calledWith(sinon.match.func.and(sinon.match(function(handler) {
          messageReceptorHandler = handler;

          return true;
        })));

        var data = {channel: 'channelId'};
        var channel = {type: 'private', members: [{_id: 'memberId'}]};

        getUserSocketsFromNamespaceResponse = [{emit: sinon.spy()}];
        messageReceptorHandler({room: room, message: data});
        expect(conversationMock.getById).to.have.been.calledWith(data.channel, sinon.match.func.and(sinon.match(function(callback) {
          callback(null, channel);

          return true;
        })));

        expect(getUserSocketsFromNamespaceResponse[0].emit).to.have.been.calledWith('message', {room: room, data: data});
        expect(getUserSocketsFromNamespaceMock).to.have.been.calledWith('memberId');
      });

      it('should listen on unsubscribe and leave the corresponding room', function() {
        onSubscribeHandler(room);
        expect(socket.on).to.have.been.calledWith('unsubscribe', sinon.match.func.and(sinon.match(function(handler) {
          handler(room);
          expect(socket.leave).to.have.been.calledWith(room);

          return true;
        })));
      });
    });
  });
});
