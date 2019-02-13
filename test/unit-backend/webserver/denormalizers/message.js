const expect = require('chai').expect;
const sinon = require('sinon');
const Q = require('q');

describe('the message denormalizer', function() {
  let lib, message, user, getDenormalizer, starredMessageId, userModule, denormalizeUserMock, dependencies, loggerMock;

  beforeEach(function() {
    starredMessageId = '999999';

    lib = {
      message: {
        isStarredBy: sinon.spy(function(message) {
          return Q.when(message._id === starredMessageId);
        })
      }
    };

    dependencies = this.moduleHelpers.dependencies;

    loggerMock = {
      error: sinon.spy()
    };

    denormalizeUserMock = {
      denormalize: sinon.stub().returns(Promise.resolve())
    };

    this.moduleHelpers.addDep('logger', loggerMock);
    this.moduleHelpers.addDep('denormalizeUser', denormalizeUserMock);

    message = {
      _id: '123',
      creator: {
        _id: 345
      }
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

    it('should call user denormalizer with the right params', function() {
      getDenormalizer().denormalizeMessage(message, user);

      expect(denormalizeUserMock.denormalize).to.have.been.calledWith(message.creator);
    });

    it('should fill response with denormalized creator', function(done) {
      const denormalized = { _id: 333, displayName: 'Bruce Willis' };

      denormalizeUserMock.denormalize.returns(Promise.resolve(denormalized));
      getDenormalizer().denormalizeMessage(message, user)
        .then(message => {
          expect(message.creator).to.decrease.equals(denormalized);

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
          expect(loggerMock.error).to.be.calledWith('Error when denormalize the message 123', error);
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

      getDenormalizer().denormalizeMessages(messages, user)
        .then(function(denormalizedMessages) {
          expect(denormalizedMessages.length).to.equal(2);
          expect(denormalizedMessages[0].isStarred).to.be.false;
          expect(denormalizedMessages[1].isStarred).to.be.true;
          done();
        })
        .catch(done);
    });
  });

  describe('the denormalizeAttachments function', function() {
    var creator, attachment;
   beforeEach(function() {

     creator = {
       password: '$11111',
       firstname: 'test',
       lastname: 'test',
       preferredEmail: 'test@test.org',
       _id: '111111111'
     };
     attachment = {
       creator: creator
     };
     denormalizeUserMock = {
       denormalize: sinon.spy(function() {
         return Q.when();
       })
     };

     userModule = {};
     this.moduleHelpers.addDep('user', userModule);
     this.moduleHelpers.addDep('denormalizeUser', denormalizeUserMock);
     dependencies = this.moduleHelpers.dependencies;

     userModule.get = sinon.spy(function(id, callback) {
       return callback(null, id);
     });
   });

   it('should denormalize attachments', function(done) {

     getDenormalizer().denormalizeAttachment(attachment)
     .then(function() {
       expect(denormalizeUserMock.denormalize).to.be.calledWith(creator);
       done();
     }).catch(done);
   });

   it('should throw an error if denormalizeAttachment is rejected', function(done) {
     const error = new Error('error message');

     denormalizeUserMock.denormalize = sinon.spy(function() {
       return Q.reject(error);
     });

     getDenormalizer().denormalizeAttachment(attachment)
       .catch(function(err) {
        expect(denormalizeUserMock.denormalize).to.be.calledWith(creator);
         expect(err).to.deep.equal(error);
         done();
       });
   });
 });

});
