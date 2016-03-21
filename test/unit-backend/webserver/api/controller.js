'use strict';

var expect = require('chai').expect;

describe('The linagora.esn.chat webserver controller', function() {

  describe('The getMessages function', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      var channelId = 1;
      var err = new Error('failed');
      var req = {params: {channel: channelId}};
      var lib = {
        channel: {
          getMessages: function(channel, options, callback) {
            expect(channel).to.equal(channelId);
            return callback(err);
          }
        }
      };
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.getMessages(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(json).to.deep.equal({error: {status: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.getMessages result', function(done) {
      var channelId = 1;
      var result = [{text: 'foo'}, {text: 'bar'}];
      var req = {params: {channel: channelId}};
      var lib = {
        channel: {
          getMessages: function(channel, options, callback) {
            expect(channel).to.equal(channelId);
            return callback(null, result);
          }
        }
      };
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.getMessages(req, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual(result);
              done();
            }
          };
        }
      });
    });
  });

  describe('The getChannels function', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function (done) {
      var err = new Error('failed');
      var lib = {
        channel: {
          getChannels: function(options, callback) {
            expect(options).to.deep.equal({});
            return callback(err);
          }
        }
      };
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.getChannels({}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(json).to.deep.equal({error: {status: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.getChannels result', function(done) {
      var result = [{id: 1}, {id: 2}];
      var lib = {
        channel: {
          getChannels: function(options, callback) {
            expect(options).to.deep.equal({});
            return callback(null, result);
          }
        }
      };
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.getChannels({}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(json).to.deep.equal(result);
              done();
            }
          };
        }
      });
    });
  });

  describe('The createChannel function', function() {

    it('should call the api with right parameters', function(done) {
      var user = {_id: 1};
      var name = 'MyChannel';
      var topic = 'MyTopic';
      var purpose = 'MyPurpose';
      var lib = {
        channel: {
          createChannel: function(options, callback) {
            expect(options).to.deep.equal({
              name: name,
              type: 'channel',
              creator: user,
              topic: {
                value: topic,
                creator: user
              },
              purpose: {
                value: purpose,
                creator: user
              }
            });
            done();
          }
        }
      };
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.createChannel({
        user: user,
        body: {
          name: name,
          topic: topic,
          purpose: purpose
        }
      });
    });

    it('should send back HTTP 500 with error when channel can not be created', function (done) {
      var err = new Error('failed');
      var lib = {
        channel: {
          createChannel: function(options, callback) {
            return callback(err);
          }
        }
      };
      var req = {body: {}}
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.createChannel(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(json).to.deep.equal({error: {status: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 201 when channel has been created', function(done) {
      var channel = {id: 1};
      var lib = {
        channel: {
          createChannel: function(options, callback) {
            return callback(null, channel);
          }
        }
      };
      var req = {body: {}}
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.createChannel(req, {
        status: function(code) {
          expect(code).to.equal(201);
          return {
            json: function(json) {
              expect(json).to.deep.equal(channel);
              done();
            }
          };
        }
      });
    });
  });

  });