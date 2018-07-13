const expect = require('chai').expect;

const CONSTANTS = require('../../../../backend/lib/constants');

describe('The conversation permission', function() {
  function getModule() {
    return require('../../../../backend/lib/permission/conversation')(() => {});
  }

  describe('The canLeave function', function() {
    it('should return false if leave direct message conversation', function(done) {
      getModule().canLeave('userId', { type: CONSTANTS.CONVERSATION_TYPE.DIRECT_MESSAGE }).then(canLeave => {
        expect(canLeave).to.be.false;
        done();
      }, done);
    });

    it('should return false if creator leaves conversation', function(done) {
      getModule().canLeave('creatorId', { type: 'not-direct-message', creator: 'creatorId' }).then(canLeave => {
        expect(canLeave).to.be.false;
        done();
      }, done);
    });

    it('should return true if member leaves conversation', function(done) {
      getModule().canLeave('memberId', { type: 'not-direct-message', creator: 'creatorId' }).then(canLeave => {
        expect(canLeave).to.be.true;
        done();
      }, done);
    });
  });
});
