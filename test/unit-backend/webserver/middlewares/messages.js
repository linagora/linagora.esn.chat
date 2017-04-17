'use strict';

const _ = require('lodash');
const expect = require('chai').expect;
const sinon = require('sinon');
const Q = require('q');
const CONSTANTS = require('../../../../backend/lib/constants');

describe('The message middleware', function() {

  let lib, err, result, resourceLinkMW;

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
      const msg = _.cloneDeep(base);
      const jsonMsg = _.cloneDeep(base);

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
      const messageId = 1;
      const req = {params: {id: messageId}};
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

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
      const messageId = 1;
      const msg1 = createMessage({text: 'foo'}, 156789);
      const req = {params: {id: messageId}};
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

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

  describe('The canStar function', function() {
    const objectType = CONSTANTS.OBJECT_TYPES.MESSAGE;
    const link = {
      target: {
        _id: '1',
        objectType: objectType
      },
      source: {
        id: 'ID'
      }
    };
    const req = {
      link: link,
      user: {
        _id: 'ID'
      }
    };

    it('should call next if req.link.objectType not equal `chat.message`', function(done) {
      link.target.objectType = 'otherOne';
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.canStar(req, {}, function() {
        done();
      });
    });

    it('should send back HTTP 400 with error when user star resource link of other user', function(done) {
      link.target.objectType = CONSTANTS.OBJECT_TYPES.MESSAGE;
      req.user._id = 'otherId';
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.canStar(req, {
        status: function(code) {
          expect(code).to.equal(400);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'You cannot star a message for someone else'
                }
              });
              done();
            }
          };
        }
      }, function() {
        done(new Error('Should not be called'));
      });
    });

    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      const targetID = 'targetID';

      link.target._id = targetID;
      link.target.objectType = CONSTANTS.OBJECT_TYPES.MESSAGE;
      link.source.id = req.user._id;
      err = new Error('failed');
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.canStar(req, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 500, message: 'Server Error', details: 'failed'}});
              expect(lib.message.getById).to.have.been.calledWith(targetID);
              done();
            }
          };
        }
      }, function() {
        done(new Error('Should not be called'));
      });
    });

    it('should send back HTTP 404 when no message returned from the lib', function(done) {

      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.canStar(req, {
        status: function(code) {
          expect(code).to.equal(404);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 404, message: 'message not found', details: 'Can not find message to star'}});
              expect(lib.message.getById).to.have.been.calledWith(link.target._id);
              done();
            }
          };
        }
      }, function() {
        done(new Error('Should not be called'));
      });
    });

    it('should set linkable to true if no error and message to star defined', function(done) {
      result = {};
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.canStar(req, {
        status: function() {

          return {
            json: function() {
              done(new Error('Should not be called'));
            }
          };
        }
      }, function() {
        expect(req.linkable).to.be.true;
        done();
      });
    });
  });

  describe('The canUnstar function', function() {

    const objectType = '';
    const link = {
      target: {
        _id: '1',
        objectType: objectType
      },
      source: {
        id: '1'
      }
    };
    const req = {
      link: link,
      user: {
        _id: 'ID'
      }
    };

    it('should call next if req.link.objectType not equal `chat.message`', function(done) {
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.canUnstar(req, {}, function() {
        done();
      });
    });

    it('should send back HTTP 400 with error when user star resource link of other user', function(done) {
      link.target.objectType = CONSTANTS.OBJECT_TYPES.MESSAGE;
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.canUnstar(req, {
        status: function(code) {
          expect(code).to.equal(400);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'You cannot unstar a message for someone else'
                }
              });
              done();
            }
          };
        }
      }, function() {
        done(new Error('Should not be called'));
      });
    });

    it('should send back HTTP 500 with error when error is sent back from middleware', function(done) {
      link.source.id = req.user._id;
      const error = new Error('Error while checking link');

      resourceLinkMW = {
        exists: sinon.spy(function() {
          return Q.reject(error);
        })
      };

      this.moduleHelpers.addDep('resourceLinkMW', resourceLinkMW);
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.canUnstar(req, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(resourceLinkMW.exists).to.have.been.calledWith(link);
              expect(json).to.shallowDeepEqual({error: {code: 500, message: 'Server Error', details: 'Can not check the resourceLink'}});
              done();
            }
          };
        }
      }, function() {
        done(new Error('Should not be called'));
      });
    });

    it('should call next if resourceLink does not exist', function(done) {
      resourceLinkMW = {
        exists: sinon.spy(function() {
          return Q.when();
        })
      };

      this.moduleHelpers.addDep('resourceLinkMW', resourceLinkMW);
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.canUnstar(req, {
        status: function() {

          return {
            json: function() {
              done(new Error('Should not be called'));
            }
          };
        }
      }, function() {
        expect(resourceLinkMW.exists).to.have.been.calledWith(link);
        done();
      });
    });

    it('should set linkable to true if not error', function(done) {
      resourceLinkMW = {
        exists: sinon.spy(function() {
          return Q.when(true);
        })
      };

      this.moduleHelpers.addDep('resourceLinkMW', resourceLinkMW);
      const middleware = getMiddleware(this.moduleHelpers.dependencies, lib);

      middleware.canUnstar(req, {
        status: function() {

          return {
            json: function() {
              done(new Error('Should not be called'));
            }
          };
        }
      }, function() {
        expect(resourceLinkMW.exists).to.have.been.calledWith(link);
        expect(req.linkable).to.be.true;
        done();
      });
    });
  });
});
