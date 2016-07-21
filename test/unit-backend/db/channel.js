'use strict';

var expect = require('chai').expect;

describe('The channel schema', function() {
  var Channel, deps;

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

    Channel = require('../../../backend/lib/db/conversation')(dependencies);
  });

  describe('channel.options.toJSON.transform', function() {
    it('should correcly remove password and accounts of members', function() {
      var transform = Channel.options.toJSON.transform;
      var message = {members: [{password: 'secret', accounts: 'accounts'}]};

      expect(transform(null, message)).to.deep.equals({members: [{}]});
    });
  });

  describe('channel.options.toObject.transform', function() {
    it('should correcly remove password and accounts of members', function() {
      var transform = Channel.options.toObject.transform;
      var message = {members: [{password: 'secret', accounts: 'accounts'}]};

      expect(transform(null, message)).to.deep.equals({members: [{}]});
    });
  });
});
