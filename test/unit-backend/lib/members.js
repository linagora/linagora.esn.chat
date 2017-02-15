'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');

const CONSTANTS = require('../../../backend/lib/constants');
const OBJECT_TYPES = CONSTANTS.OBJECT_TYPES;

describe('The members lib', function() {
  let collaboration, dependencies, user, conversation;

  beforeEach(function() {
    user = {_id: 1};
    conversation = {_id: 2};
    collaboration = {
      member: {
        join: sinon.spy(function(objectType, collaboration, userAuthor, userTarget, actor, callback) {
          callback();
        })
      }
    };

    this.moduleHelpers.addDep('collaboration', collaboration);
    dependencies = this.moduleHelpers.dependencies;
  });

  function getModule() {
    return require('../../../backend/lib/members')(dependencies);
  }

  describe('The join function', function(done) {
    it('should call the collaboration.join function with the right parameters', function() {
      getModule().join(conversation, user).then(function() {
        expect(collaboration.member.join).to.have.been.calledWith(OBJECT_TYPES.CONVERSATION, conversation, user, user, user);
        done();
      }, done);
    });
  });
});
