'use strict';
/*eslint no-unused-vars: ["error", {"args": "after-used"}]*/

let expect = require('chai').expect;
let sinon = require('sinon');

describe('The collaboration controller', function() {

  let lib, err, result;

  beforeEach(function() {
    err = undefined;
    result = undefined;

    lib = {
      collaboration: {
        getForUser: sinon.spy(function(user, callback) {
          return callback(err, result);
        }),
        listForUser: sinon.spy(function(user, callback) {
          return callback(err, result);
        })
      },
      conversation: {
        getChannels: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        create: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        find: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        removeMember: sinon.spy(function(channelId, userId, callback) {
          return callback(err, result);
        }),
        addMember: sinon.spy(function(channelId, userId, callback) {
          return callback(err, result);
        }),
        updateTopic: sinon.spy(function(channelId, topic, callback) {
          return callback(err, result);
        })
      }
    };
  });

  function getController(dependencies, lib) {
    return require('../../../../backend/webserver/controllers/collaboration')(dependencies, lib);
  }

  describe('The listConversationsForUser', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.listConversationsForUser({user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.collaboration.listForUser).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500, details: 'Error while getting conversations for collaborations'}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.collaboration.getForUser result', function(done) {
      result = [];
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.listConversationsForUser({user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.collaboration.listForUser).to.have.been.calledWith({_id: 'id'});
              expect(json).to.deep.equal(result);
              done();
            }
          };
        }
      });
    });
  });
});
