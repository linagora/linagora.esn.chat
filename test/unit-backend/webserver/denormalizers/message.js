const expect = require('chai').expect;
const sinon = require('sinon');
const Q = require('q');

describe('the message denormalizer', function() {
  let lib, deps, message, user, getDenormalizer, starredMessageId;

  function dependencies(name) {
    return deps[name];
  }

  beforeEach(function() {
    starredMessageId = '999999';

    lib = {
      message: {
        isStarredBy: sinon.spy(function(message) {
          return Q.when(message._id === starredMessageId);
        })
      }
    };

    deps = {
      logger: {
        error: sinon.spy()
      }
    };

    message = {
      _id: '123'
    };
    user = {
      _id: '222',
      firstname: 'Dali',
      lastName: 'Dali'
    };

    getDenormalizer = function() {
      return require('../../../../backend/webserver/denormalizers/message')(dependencies, lib);
    };
  });

  describe('the denormalizeMessage function', function() {

    it('should call isStarredBy with the right params', function() {
      getDenormalizer().denormalizeMessage(message, user);

      expect(lib.message.isStarredBy).to.be.calledWith(message, user);
    });

    it('should return the message with a new field isStarred = false if the message is not starred', function(done) {
      message._id = starredMessageId + '0';

      getDenormalizer().denormalizeMessage(message, user)
        .then(function(message) {
          expect(message.isStarred).to.be.false;
          done();
        })
        .catch(done);
    });

    it('should return the message with a new field isStarred = true if the message is starred', function(done) {
      message._id = starredMessageId;

      getDenormalizer().denormalizeMessage(message, user)
        .then(function(message) {
          expect(message.isStarred).to.be.true;
          done();
        })
        .catch(done);
    });

    it('should call logger.error if isStarredBy function throw an error', function(done) {
      const error = new Error('error message');

      lib.message.isStarredBy = function() {
        return Q.reject(error);
      };

      getDenormalizer().denormalizeMessage(message, user)
        .catch(function(err) {
          expect(err).to.deep.equal(error);
          expect(deps.logger.error).to.be.calledWith('Error when denormalize the message 123', error);
          done();
        });
    });
  });

  describe('the denormalizeMessages function', function(done) {

    it('should denormalize all the messages', function() {
      const messages = [
        {
          _id: '123',
          text: 'text'
        },
        {
          _id: starredMessageId,
          text: 'text2'
        }
      ];

      getDenormalizer().denormalizeMessage(messages, user)
        .then(function(denormalizedMessages) {
          expect(denormalizedMessages.length).to.equal(2);
          expect(denormalizedMessages[0].isStarred).to.be.false;
          expect(denormalizedMessages[1].isStarred).to.be.true;
          done();
        });
    });
  });
});
