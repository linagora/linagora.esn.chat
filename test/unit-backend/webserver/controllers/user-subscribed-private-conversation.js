'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');
const _ = require('lodash');
const Q = require('q');
const CONSTANTS = require('../../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;

describe('The user-subscribed-private-conversation controller', function() {

  let lib, err, result, subscribedConversations;

  beforeEach(function() {
    err = undefined;
    result = undefined;
    subscribedConversations = undefined;

    lib = {
      userSubscribedPrivateConversation: {
        get: sinon.spy(function(userid) {
          return Q.when(subscribedConversations);
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

      controller.getUserSubscribedPrivateConversations({ user: {_id: "11"}}, {
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
      subscribedConversations = {conversations: "conversations"};
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getUserSubscribedPrivateConversations({ user: {_id: "11"}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.userSubscribedPrivateConversation.get).to.have.been.called;
              expect(json).to.deep.equal("conversations");
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
      const controller = getController(this.moduleHelpers.dependencies, lib);


      controller.getUserSubscribedPrivateConversations({ user: {_id: "11"}}, {
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
