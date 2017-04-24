'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const _ = require('lodash');
const Q = require('q');

describe('The message controller', function() {

  var lib, err, result;

  beforeEach(function() {
    err = undefined;
    result = undefined;

    lib = {
      message: {
        getById: sinon.spy(function(id, callback) {
          return callback(err, result);
        }),
        getForConversation: sinon.spy(function(channel, options, callback) {
          return callback(err, result);
        }),
        isStarredBy: function() {
          return Q.when();
        }
      }
    };
  });

  function getController(dependencies, lib) {
    return require('../../../../backend/webserver/controllers/message')(dependencies, lib);
  }

  describe('The getForConversation function', function() {

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
      var query = 'myquery';
      var req = {conversation: {_id: channelId}, query: query};
      var controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getForConversation(req, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              expect(lib.message.getForConversation).to.have.been.calledWith(channelId, query);
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.getForConversation result', function(done) {
      var channelId = 1;
      var query = 'MyQuery';
      var msg1 = createMessage({text: 'foo'}, 156789);
      var msg2 = createMessage({text: 'bar'}, 2345677);
      var req = {conversation: {_id: channelId}, query: query};
      var controller = getController(this.moduleHelpers.dependencies, lib);

      result = [msg1.dest, msg2.dest];
      controller.getForConversation(req, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual([msg1.dest, msg2.dest]);
              expect(lib.message.getForConversation).to.have.been.calledWith(channelId, query);
              done();
            }
          };
        }
      });
    });
  });
});
