'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Q = require('q');

describe('The user-subscribed-private-conversation controller', function() {

  let lib, ObjectId, db, err, subscribedConversations, conversations;

  beforeEach(function() {
    err = undefined;
    subscribedConversations = undefined;
    conversations = [{_id: 1, name: 'My first conversation'}, {_id: 2, name: 'My second conversation'}];
    ObjectId = require('mongoose').Types.ObjectId;

    db = {
      mongo: {
        mongoose: {
          Types: {
            ObjectId: ObjectId
          }
        }
      }
    };
    this.moduleHelpers.addDep('db', db);
    lib = {
      userSubscribedPrivateConversation: {
        get: sinon.spy(function() {
          return Q.when(subscribedConversations);
        }),
        store: sinon.spy(function() {
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

  describe('The get function', function() {
    it('should send back HTTP 200 with an empty array when there is no subscribed conversations', function(done) {
      const controller = getController(this.moduleHelpers.dependencies, lib);

      subscribedConversations = [];
      conversations = [];
      controller.get({ user: {_id: '11'}}, {
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

      controller.get({ user: {_id: '11'}}, {
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

      controller.get({ user: {_id: '11'}}, {
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

  describe('The store function', function() {
    it('should send back HTTP 200 with an empty array when there is no subscribed conversations', function(done) {
      subscribedConversations = {conversations: []};
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.store({ user: {_id: '11'}, body: {conversationIds: []}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.userSubscribedPrivateConversation.store).to.have.been.called;
              expect(json).to.deep.equal(subscribedConversations.conversations);
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the subscribedConversations as result', function(done) {
      const conv = '012345678901234567890123';

      subscribedConversations = {conversations: [conv, conv]};
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.store({ user: {_id: '11'}, body: {conversationIds: [conv, conv]}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.userSubscribedPrivateConversation.store).to.have.been.called;
              expect(json).to.deep.equal(subscribedConversations.conversations);
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      lib.userSubscribedPrivateConversation.store = sinon.spy(function() {
        return Q.reject(err);
      });
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.store({ user: {_id: '11'}, body: {conversationIds: []}}, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.userSubscribedPrivateConversation.store).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });
  });
});
