'use strict';

var mockery = require('mockery');
var sinon = require('sinon');
var expect = require('chai').expect;

describe('The linagora.esn.chat channel lib', function() {

  describe('The getChannels function', function() {

    it('should call ChatChannel.find', function(done) {
      mockery.registerMock('mongoose', {
        model: function(type) {
          return {
            find: function(cb) {
              expect(type).to.equal('ChatChannel');
              cb();
            }
          };
        }
      });
      require('../../../backend/lib/channel').getChannels({}, done);
    });
  });

  describe('The getChannel function', function() {

    it('should call ChatChannel.findById', function(done) {
      var channel = 1;
      mockery.registerMock('mongoose', {
        model: function(type) {
          return {
            findById: function(channel, cb) {
              expect(type).to.equal('ChatChannel');
              expect(channel).to.equal(channel);
              cb();
            }
          };
        }
      });
      require('../../../backend/lib/channel').getChannel(channel, done);
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

      mockery.registerMock('mongoose', {
        model: function() {
          return ChatChannel;
        }
      });
      require('../../../backend/lib/channel').createChannel(options, done);
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

      mockery.registerMock('mongoose', {
        model: function(type) {
          if (type === 'ChatMessage') {
            return ChannelMessage;
          }
        }
      });
      require('../../../backend/lib/channel').createMessage(message, done);
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

      mockery.registerMock('mongoose', {
        model: function() {
          return {
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
        }
      });
      require('../../../backend/lib/channel').getMessages(options, query, done);
    });
  });

});
