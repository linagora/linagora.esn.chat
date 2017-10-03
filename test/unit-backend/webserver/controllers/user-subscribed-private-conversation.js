'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Q = require('q');

describe('The user-subscribed-private-conversation controller', function() {

  let lib, err, subscribedConversations, conversations;

  beforeEach(function() {
    err = undefined;
    subscribedConversations = undefined;
    conversations = [{_id: 1, name: 'My first conversation'}, {_id: 2, name: 'My second conversation'}];
    lib = {
      userSubscribedPrivateConversation: {
        get: sinon.spy(function() {
          return Q.when(subscribedConversations);
        }),
        getByIds: sinon.spy(function() {
          return Q.when(conversations);
        })
      }
    };
  });

  function getController(dependencies, lib) {
    return require('../../../../backend/webserver/controllers/user-subscribed-private-conversation')(dependencies, lib);
  }

  describe('The getUserSubscribedPrivateConversations function', function() {
    it('should send back HTTP 200 with an empty array when there is no subscribed conversations', function(done) {
      const controller = getController(this.moduleHelpers.dependencies, lib);

      subscribedConversations = [];
      conversations = [];
      controller.getUserSubscribedPrivateConversations({ user: {_id: '11'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.userSubscribedPrivateConversation.get).to.have.been.called;
              expect(json).to.deep.equal([]);
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the subscribedConversations as result', function(done) {
      subscribedConversations = [];
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getUserSubscribedPrivateConversations({ user: {_id: '11'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.userSubscribedPrivateConversation.get).to.have.been.called;
              expect(json).to.deep.equal(conversations);
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      lib.userSubscribedPrivateConversation.get = sinon.spy(function() {
        return Q.reject(err);
      });
      conversations = [];
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getUserSubscribedPrivateConversations({ user: {_id: '11'}}, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.userSubscribedPrivateConversation.get).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });
  });
});
