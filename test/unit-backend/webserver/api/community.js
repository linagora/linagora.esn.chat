'use strict';
/*eslint no-unused-vars: ["error", {"args": "after-used"}]*/

let expect = require('chai').expect;
let sinon = require('sinon');
let CONSTANTS = require('../../../../backend/lib/constants');
let CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('The community controller', function() {

  let lib, err, result;

  beforeEach(function() {
    err = undefined;
    result = undefined;

    lib = {
      conversation: {
        getMessage: sinon.spy(function(id, callback) {
          return callback(err, result);
        }),
        getCommunityConversationByCommunityId: sinon.spy(function(id, callback) {
          return callback(err, result);
        }),
        getMessages: sinon.spy(function(channel, options, callback) {
          return callback(err, result);
        }),
        getChannels: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        createConversation: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        findConversation: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        removeMemberFromConversation: sinon.spy(function(channelId, userId, callback) {
          return callback(err, result);
        }),
        addMemberToConversation: sinon.spy(function(channelId, userId, callback) {
          return callback(err, result);
        }),
        updateTopic: sinon.spy(function(channelId, topic, callback) {
          return callback(err, result);
        })
      }
    };
  });

  function getController(dependencies, lib) {
    return require('../../../../backend/webserver/controllers/community')(dependencies, lib);
  }

  describe('The findMyCommunityConversations', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.findMyCommunityConversations({user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.conversation.findConversation).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.findPrivateByMembers result calledWith exactMatch === false and authenticated user as a member', function(done) {
      result = {};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.findMyCommunityConversations({query: {members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.conversation.findConversation).to.have.been.calledWith({type: CONVERSATION_TYPE.COMMUNITY, ignoreMemberFilterForChannel: true, members: ['id']});
              expect(json).to.equal(result);
              done();
            }
          };
        }
      });
    });
  });
});
