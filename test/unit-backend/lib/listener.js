'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var CONSTANTS = require('../../../backend/lib/constants');

describe('The linagora.esn.chat lib listener module', function() {

  describe('The start function', function() {

    var deps, listener, globalPublish;
    var dependencies = function(name) {
      return deps[name];
    };

    beforeEach(function() {
      globalPublish = sinon.spy();
      deps = {
        logger: {
          error: console.log,
          info: console.log,
          debug: console.log
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

    it('should not save the message when message.type is user_typing', function(done) {
      var data = {
        message: {
          type: 'user_typing'
        }
      };

      var channel = {
        createMessage: function() {
          return done(new Error());
        }
      };

      var module = require('../../../backend/lib/listener')(dependencies);
      module.start(channel);

      listener(data);
      done();
    });

    it('should save the message when message.type is not user_typing and broadcast to globalpubsub to saved message', function(done) {
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
