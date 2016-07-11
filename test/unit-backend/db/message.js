'use strict';

var expect = require('chai').expect;

describe('The message schema', function() {
  var Message, deps;

  function dependencies(name) {
    return deps[name];
  }

  beforeEach(function() {
    deps = {
      db: {
        mongo: {
          mongoose: require('mongoose')
        }
      }
    };

    deps.db.mongo.mongoose.model = function(name, constructor) {
      return constructor;
    };

    Message = require('../../../backend/lib/db/message')(dependencies);
  });

  describe('channel.options.toJSON.transform', function() {
    it('should correcly remove password and account', function() {
      var transform = Message.options.toJSON.transform;
      var message = {creator: {password: 'secret', accounts: 'account'}, text: 'text'};

      expect(transform(null, message)).to.deep.equals({creator: {}, text: 'text'});
    });

    it('should replace date by timestamp', function() {
      var transform = Message.options.toJSON.transform;
      var date = new Date();
      var message = {timestamps: {creation: date}};

      expect(transform(null, message)).to.deep.equals({timestamps: {creation: date.getTime()}});
    });
  });

  describe('channel.options.toObject.transform', function() {
    it('should correcly remove password and account', function() {
      var transform = Message.options.toObject.transform;
      var message = {creator: {password: 'secret', accounts: 'account'}, text: 'text'};

      expect(transform(null, message)).to.deep.equals({creator: {}, text: 'text'});
    });

    it('should replace date by timestamp', function() {
      var transform = Message.options.toObject.transform;
      var date = new Date();
      var message = {timestamps: {creation: date}};

      expect(transform(null, message)).to.deep.equals({timestamps: {creation: date.getTime()}});
    });
  });
});
