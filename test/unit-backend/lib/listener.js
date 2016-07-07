'use strict';

var expect = require('chai').expect;

describe('The linagora.esn.chat lib listener module', function() {

  describe('The start function', function() {

    var deps, listener;
    var dependencies = function(name) {
      return deps[name];
    };

    beforeEach(function() {
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

    it('should save the message when message.type is not user_typing', function(done) {
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
        }
      };

      var channelMock = {
        createMessage: function(msg) {
          expect(msg).to.deep.equals({
            type: type,
            text: text,
            creator: creator,
            channel: channel,
            attachments: attachments
          });
          done();
        }
      };

      var module = require('../../../backend/lib/listener')(dependencies);
      module.start(channelMock);

      listener(data);
    });
  });
});
