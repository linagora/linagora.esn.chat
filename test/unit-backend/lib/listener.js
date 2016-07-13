'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var _ = require('lodash');
var CONSTANTS = require('../../../backend/lib/constants');

describe('The linagora.esn.chat lib listener module', function() {

  describe('The start function', function() {
    var deps, listener, globalPublish, ChatMessageMock, dependencies;

    beforeEach(function() {
      dependencies = function(name) {
        return deps[name];
      };

      ChatMessageMock = sinon.spy(function() {
        this.populate = ChatMessageMock.populate;
      });

      ChatMessageMock.populate = sinon.spy(_.identity);

      globalPublish = sinon.spy();
      deps = {
        logger: {
          error: console.log,
          info: console.log,
          debug: console.log
        },
        db: {
          mongo: {
            mongoose: {
              model: sinon.spy(function(name) {
                if (name === 'ChatMessage') {
                  return ChatMessageMock;
                }
              })
            }
          }
        },
        pubsub: {
          local: {
            topic: function() {
              return {
                subscribe: function(cb) {
                  listener = cb;
                }
              };
            }
          },
          global: {
            topic: sinon.spy(function() {
              return {
                publish: globalPublish
              };
            })
          }
        }
      };
    });

    it('should not save, populate and keep state when message.type is user_typing', function(done) {
      var data = {
        message: {
          state: 'state',
          type: 'user_typing'
        },
        room: 'room'
      };

      var channel = {
        createMessage: function() {
          return done(new Error());
        }
      };

      var module = require('../../../backend/lib/listener')(dependencies);
      module.start(channel);

      ChatMessageMock.populate = function(field, callback) {
        expect(field).to.equals('creator');
        expect(ChatMessageMock).to.have.been.calledWith(data.message);
        callback(null, {toJSON: _.constant({})});
        expect(globalPublish).to.have.been.calledWith({room: data.room, message: {state: data.message.state}});
        done();
      };
      listener(data);
    });

    it('should broadcast users_mention', function(done) {
      var data = {
        message: {
          type: 'text',
          text: 'yolo',
          creator: '1',
          channel: 'general',
        },
        room: 'room'
      };

      var createMessageResult = {user_mentions: ['user']};

      var channelMock = {
        createMessage: sinon.spy(function(_m, callback) {
          callback(null, createMessageResult);
          expect(globalPublish).to.have.been.calledWith({room: data.room, message: createMessageResult, for: 'user'});
          expect(deps.pubsub.global.topic).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.USERS_MENTION);
          done();
        })
      };

      var module = require('../../../backend/lib/listener')(dependencies);
      module.start(channelMock);

      listener(data);
    });

    it('should save the message when message.type is not user_typing and broadcast to globalpubsub the saved message', function(done) {
      var type = 'text';
      var text = 'yolo';
      var creator = '1';
      var channel = 'general';
      var attachments = [1, 2, 3];
      var data = {
        message: {
          type: type,
          text: text,
          creator: creator,
          channel: channel,
          attachments: attachments
        },
        room: 'room'
      };

      var createMessageResult = 'createMessageResult';

      var channelMock = {
        createMessage: sinon.spy(function(_m, callback) {
          callback(null, createMessageResult);
        })
      };

      var module = require('../../../backend/lib/listener')(dependencies);
      module.start(channelMock);

      globalPublish = function(data) {
        expect(channelMock.createMessage).to.have.been.calledWith({
          type: type,
          text: text,
          creator: creator,
          channel: channel,
          attachments: attachments
        });

        expect(deps.pubsub.global.topic).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.MESSAGE_RECEIVED);
        expect(data).to.be.deep.equals({room: data.room, message: createMessageResult});
        done();
      };

      listener(data);
    });
  });
});
