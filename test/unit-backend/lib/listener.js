'use strict';

var expect = require('chai').expect;

describe('The linagora.esn.chat lib listener module', function() {

  describe('The start function', function() {

    var deps;
    var dependencies = function(name) {
      return deps[name];
    };

    beforeEach(function() {
      deps = {
        logger: {
          error: console.log,
          info: console.log,
          debug: console.log
        }
      };
    });

    it('should not save the message when message.type is user_typing', function(done) {
      var listener = null;
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

      deps.pubsub = {
        local: {
          topic: function() {
            return {
              subscribe: function(cb) {
                listener = cb;
              }
            };
          }
        }
      };

      var module = require('../../../backend/lib/listener')(dependencies);
      module.start(channel);

      listener(data);
      done();
    });

    it('should save the message when message.type is not user_typing', function(done) {
      var listener = null;
      var type = 'text';
      var text = 'yolo';
      var user = '1';
      var channel = 'general';
      var attachments = [1, 2, 3];
      var data = {
        message: {
          type: type,
          text: text,
          user: user,
          channel: channel,
          attachments: attachments
        }
      };

      var channelMock = {
        createMessage: function(msg) {
          expect(msg).to.deep.equals({
            type: type,
            text: text,
            creator: user,
            channel: channel,
            attachments: attachments
          });
          done();
        }
      };

      deps.pubsub = {
        local: {
          topic: function() {
            return {
              subscribe: function(cb) {
                listener = cb;
              }
            };
          }
        }
      };

      var module = require('../../../backend/lib/listener')(dependencies);
      module.start(channelMock);

      listener(data);
    });
  });
});
