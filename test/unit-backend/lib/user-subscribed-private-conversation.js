'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const Q = require('q');

describe('The linagora.esn.chat ChatUserSubscribedPrivateConversation lib', function() {

  let lib, deps, ObjectId, modelsMock;

  function dependencies(name) {
    return deps[name];
  }

  beforeEach(function() {

    ObjectId = require('mongoose').Types.ObjectId;

    modelsMock = {
      ChatUserSubscribedPrivateConversation: {
        findById: sinon.spy(function() {

          return Q.when([]);
        })
      }
    };

    deps = {
      db: {
        mongo: {
          mongoose: {
            model: function(type) {
              return modelsMock[type];
            },
            Types: {
              ObjectId: ObjectId
            }
          }
        }
      }
    };

    lib = {
      utils: require('../../../backend/lib/utils')(dependencies)
    };
  });

  describe('The get function', function() {

    it('should call userSubscribedPrivateConversation.findById', function(done) {
      const userId = '0xFF';

      require('../../../backend/lib/user-subscribed-private-conversation')(dependencies, lib).get(userId).then(function() {
        expect(modelsMock.ChatUserSubscribedPrivateConversation.findById).to.have.been.calledWith('0xFF');
        done();
      });
    });
  });

});
