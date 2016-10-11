'use strict';

const _ = require('lodash');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('The message middleware', function() {

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
        })
      }
    };
  });

  function getMiddleware(dependencies, lib) {
    return require('../../../../backend/webserver/middlewares/message')(dependencies, lib);
  }

  describe('The load function', function() {

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
      var middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.load(req, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              expect(lib.message.getById).to.have.been.calledWith(messageId);
              done();
            }
          };
        }
      }, function() {
        done(new Error('Should not be called'));
      });
    });

    it('should call next with the lib.getById result in req.message', function(done) {
      var messageId = 1;
      var msg1 = createMessage({text: 'foo'}, 156789);
      var req = {params: {id: messageId}};
      var middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      result = msg1.dest;
      middleware.load(req, {
        status: function() {
          return {
            json: function() {
              done(new Error('Should not be called'));
            }
          };
        }
      }, function() {
        expect(req.message).to.shallowDeepEqual(msg1.dest);
        expect(lib.message.getById).to.have.been.calledWith(messageId);
        done();
      });
    });
  });
});
