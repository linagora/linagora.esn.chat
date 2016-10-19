'use strict';

const expect = require('chai').expect;

describe('The collaboration permission module', function() {

  let dependencies, deps, logger;

  beforeEach(function() {
    dependencies = function(name) {
      return deps[name];
    };

    logger = {
      error: console.log,
      info: console.log,
      debug: console.log,
      warn: console.log
    };

    deps = {
      logger: logger,
    };
  });

  describe('The userCanWrite function', function() {

    describe('on collaboration conversation', function() {
      it('should reject when collaboration can not be found', function(done) {
        const user = {_id: 1};
        const conversation = {
          type: 'collaboration',
          collaboration: {
            objectType: 'community',
            id: '1'
          }
        };

        deps.collaboration = {
          queryOne: function(query, options, callback) {
            callback();
          },
          permission: {
            canWrite: function() {}
          }
        };
        const module = require('../../../../backend/lib/permission/conversation')(dependencies);

        module.userCanWrite(user, conversation).then(done, function(err) {
          expect(err.message).to.match(/Collaboration not found/);
          done();
        });
      });

      it('should reject when collaboration.queryOne fails', function(done) {
        const msg = 'I failed!';
        const user = {_id: 1};
        const conversation = {
          type: 'collaboration',
          collaboration: {
            objectType: 'community',
            id: '1'
          }
        };

        deps.collaboration = {
          queryOne: function(query, options, callback) {
            callback(new Error(msg));
          },
          permission: {
            canWrite: function() {}
          }
        };
        const module = require('../../../../backend/lib/permission/conversation')(dependencies);

        module.userCanWrite(user, conversation).then(done, function(err) {
          expect(err.message).to.equal(msg);
          done();
        });
      });

      it('should reject when collaboration.permission.canWrite fails', function(done) {
        const msg = 'I failed';
        const user = {_id: 1};
        const conversation = {
          type: 'collaboration',
          collaboration: {
            objectType: 'community',
            id: '1'
          }
        };

        deps.collaboration = {
          queryOne: function(query, options, callback) {
            callback(null, {});
          },
          permission: {
            canWrite: function(collaboration, tuple, callback) {
              callback(new Error(msg));
            }
          }
        };
        const module = require('../../../../backend/lib/permission/conversation')(dependencies);

        module.userCanWrite(user, conversation).then(done, function(err) {
          expect(err.message).to.equal(msg);
          done();
        });
      });

      it('should resolve with the permission value', function(done) {
        const result = 'writeResult';
        const user = {_id: 1};
        const conversation = {
          type: 'collaboration',
          collaboration: {
            objectType: 'community',
            id: '1'
          }
        };

        deps.collaboration = {
          queryOne: function(query, options, callback) {
            callback(null, {});
          },
          permission: {
            canWrite: function(collaboration, tuple, callback) {
              callback(null, result);
            }
          }
        };
        const module = require('../../../../backend/lib/permission/conversation')(dependencies);

        module.userCanWrite(user, conversation).then(function(write) {
          expect(write).to.equal(result);
          done();
        }, done);
      });
    });
  });
});
