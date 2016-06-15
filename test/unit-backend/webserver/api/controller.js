'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var _ = require('lodash');

describe('The linagora.esn.chat webserver controller', function() {

  var lib, err, result, user;

  beforeEach(function() {
    err = undefined;
    result = undefined;
    user = {_id: 1};

    lib = {
      channel: {
        getMessages: sinon.spy(function(channel, options, callback) {
          return callback(err, result);
        }),
        getChannels: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        createChannel: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        findGroupByMembers: sinon.spy(function(exact, members, callback) {
          return callback(err, result);
        }),
        removeMemberFromChannel: sinon.spy(function(channelId, userId, callback) {
          return callback(err, result);
        }),
        addMemberToChannel: sinon.spy(function(channelId, userId, callback) {
          return callback(err, result);
        }),
        updateTopic: sinon.spy(function(channelId, topic, callback) {
          return callback(err, result);
        })
      }
    };
  });

  describe('The getMessages function', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      var channelId = 1;
      err = new Error('failed');
      var req = {params: {channel: channelId}};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.getMessages(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              expect(lib.channel.getMessages).to.have.been.calledWith(channelId);
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.getMessages result', function(done) {
      var channelId = 1;
      result = [{text: 'foo'}, {text: 'bar'}];
      var req = {params: {channel: channelId}};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.getMessages(req, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual(result);
              expect(lib.channel.getMessages).to.have.been.calledWith(channelId);
              done();
            }
          };
        }
      });
    });
  });

  describe('The getChannels function', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.getChannels({}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.channel.getChannels).to.have.been.calledWith({});
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.getChannels result', function(done) {
      result = [{id: 1}, {id: 2}];
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.getChannels({}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.channel.getChannels).to.have.been.calledWith({});
              expect(json).to.deep.equal(result);
              done();
            }
          };
        }
      });
    });
  });

  describe('The findMyUsersGroups', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findMyUsersGroups({user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.channel.findGroupByMembers).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.findGroupByMembers result calledWith exactMatch === false and authenticated user as a member', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findMyUsersGroups({query: {members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.channel.findGroupByMembers).to.have.been.calledWith(false, ['id']);
              expect(json).to.equal(result);
              done();
            }
          };
        }
      });
    });
  });

  describe('leaveChannel', function() {
    it('shoud send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.leaveChannel({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.channel.removeMemberFromChannel).to.have.been.calledWith('channelId', 'id');
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('shoud send back HTTP 204 when lib.leaveChannel success', function(done) {
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.leaveChannel({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(204);
          return {
            end: function() {
              expect(lib.channel.removeMemberFromChannel).to.have.been.calledWith('channelId', 'id');
              done();
            }
          };
        }
      });
    });
  });

  describe('joinChannel', function() {
    it('shoud send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.joinChannel({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.channel.addMemberToChannel).to.have.been.calledWith('channelId', 'id');
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('shoud send back HTTP 204 when lib.joinChannel success', function(done) {
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.joinChannel({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(204);
          return {
            end: function() {
              expect(lib.channel.addMemberToChannel).to.have.been.calledWith('channelId', 'id');
              done();
            }
          };
        }
      });
    });
  });

  describe('The findGroupByMembers', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findGroupByMembers({query: {members: 'id'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.channel.findGroupByMembers).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.findGroupByMembers result calledWith exactMatch === true', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findGroupByMembers({query: {members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.channel.findGroupByMembers).to.have.been.calledWith(true);
              expect(json).to.equal(result);
              done();
            }
          };
        }
      });
    });

    it('should handle query with more than one member and add auth user as a member', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findGroupByMembers({query: {members: ['1', '2']}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.channel.findGroupByMembers).to.have.been.calledWith(true, ['1', '2', 'id']);
              done();
            }
          };
        }
      });
    });

    it('should handle query with just one member and add auth user as a member', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findGroupByMembers({query: {members: '1'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.channel.findGroupByMembers).to.have.been.calledWith(true, ['1', 'id']);
              done();
            }
          };
        }
      });
    });

    it('should not add auth user if already passed as membres arguments', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findGroupByMembers({query: {members: ['1', 'id']}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.channel.findGroupByMembers).to.have.been.calledWith(true, ['1', 'id']);
              done();
            }
          };
        }
      });
    });
  });

  describe('The createChannel function', function() {

    it('should call the api with right parameters', function(done) {
      var name = 'MyChannel';
      var topic = 'MyTopic';
      var purpose = 'MyPurpose';
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.createChannel({
        user: user,
        query: {},
        body: {
          name: name,
          type: 'type',
          topic: topic,
          purpose: purpose
        }
      }, {
        status: _.constant({json: function() {
            expect(lib.channel.createChannel).to.have.been.calledWith({
              name: name,
              type: 'type',
              creator: user,
              topic: {
                value: topic,
                creator: user
              },
              purpose: {
                value: purpose,
                creator: user
              },
              members: ['1']
            });
            done();
          }})
      });
    });

    it('should take into consideration extras members', function(done) {
      var name = 'MyChannel';
      var topic = 'MyTopic';
      var purpose = 'MyPurpose';
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.createChannel({
        user: user,
        body: {
          name: name,
          topic: topic,
          type: 'type',
          members: ['2', '3'],
          purpose: purpose
        }
      }, {
        status: _.constant({json: function() {
            expect(lib.channel.createChannel).to.have.been.calledWith(sinon.match({
              members: ['2', '3', '1']
            }));
            done();
          }})
      });
    });

    it('should send back HTTP 500 with error when channel can not be created', function(done) {
      err = new Error('failed');
      var req = {body: {}, query: {}, user: user};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.createChannel(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 201 when channel has been created', function(done) {
      var channel = {id: 1};
      result = channel;
      var req = {body: {}, query: {}, user: user};
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

  describe('The updateTopic function', function() {
    it('should send back HTTP 500 with error when channel can not be updated', function(done) {
      err = new Error('failed');
      var req = {body: {}, params: {id: 'channelId'}, query: {}, user: user};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.updateTopic(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 when channel has been updated', function(done) {
      var channel = {id: 1};
      result = 1;
      var req = {body: {}, params: {id: channel.id}, query: {}, user: user};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.updateTopic(req, {
        status: function(code) {
          expect(code).to.be.equal(200);
          return {
            json: function(json) {
              expect(json).to.be.equal(1);
              done();
            }
          };
        }
      });
    });
  });
});
