'use strict';
/*eslint no-unused-vars: ["error", {"args": "after-used"}]*/

var expect = require('chai').expect;
var sinon = require('sinon');
var _ = require('lodash');

describe('The message controller', function() {

  var lib, err, result;

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
    return require('../../../../backend/webserver/controllers/message')(dependencies, lib);
  }

  describe('The getMessages function', function() {

    function createMessage(base, timestamp) {
      var msg = _.cloneDeep(base);
      var jsonMsg = _.cloneDeep(base);
      msg.creator = {
        password: 'yolo'
      };
      jsonMsg.creator = {};
      msg.timestamps = {
        creation: new Date(timestamp)
      };
      jsonMsg.timestamps = {
        creation: timestamp
      };
      msg.toJSON = function() {
        return msg;
      };

      return {source: msg, dest: jsonMsg};
    }

    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var channelId = 1;
      var req = {params: {channel: channelId}};
      var controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getMessages(req, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              expect(lib.conversation.getMessages).to.have.been.calledWith(channelId);
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.getMessages result', function(done) {
      var channelId = 1;
      var msg1 = createMessage({text: 'foo'}, 156789);
      var msg2 = createMessage({text: 'bar'}, 2345677);
      var req = {params: {channel: channelId}};
      var controller = getController(this.moduleHelpers.dependencies, lib);

      result = [msg1.dest, msg2.dest];
      controller.getMessages(req, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual([msg1.dest, msg2.dest]);
              expect(lib.conversation.getMessages).to.have.been.calledWith(channelId);
              done();
            }
          };
        }
      });
    });
  });

  describe('The getMessage function', function() {

    function createMessage(base, timestamp) {
      var msg = _.cloneDeep(base);
      var jsonMsg = _.cloneDeep(base);

      msg.creator = {
        password: 'yolo'
      };
      jsonMsg.creator = {};
      msg.timestamps = {
        creation: new Date(timestamp)
      };
      jsonMsg.timestamps = {
        creation: timestamp
      };
      msg.toJSON = function() {
        return msg;
      };

      return {source: msg, dest: jsonMsg};
    }

    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var messageId = 1;
      var req = {params: {id: messageId}};
      var controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getMessage(req, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              expect(lib.conversation.getMessage).to.have.been.calledWith(messageId);
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.getMessage result', function(done) {
      var messageId = 1;
      var msg1 = createMessage({text: 'foo'}, 156789);
      var req = {params: {id: messageId}};
      var controller = getController(this.moduleHelpers.dependencies, lib);

      result = msg1.dest;
      controller.getMessage(req, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual(msg1.dest);
              expect(lib.conversation.getMessage).to.have.been.calledWith(messageId);
              done();
            }
          };
        }
      });
    });
  });
});
