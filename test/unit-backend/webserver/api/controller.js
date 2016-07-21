'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var _ = require('lodash');
var CONSTANTS = require('../../../../backend/lib/constants');
var CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('The linagora.esn.chat webserver controller', function() {

  var lib, err, result, user;

  beforeEach(function() {
    err = undefined;
    result = undefined;
    user = {_id: 1};

    lib = {
      conversation: {
        getMessage: sinon.spy(function(id, callback) {
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
        findConversationByTypeAndByMembers: sinon.spy(function(type, exact, members, callback) {
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
      result = [msg1.dest, msg2.dest];
      var req = {params: {channel: channelId}};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
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
      var messageId = 1;
      err = new Error('failed');
      var req = {params: {id: messageId}};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
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
      result = msg1.dest;
      var req = {params: {id: messageId}};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
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

  describe('The getChannels function', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.getChannels({}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.conversation.getChannels).to.have.been.calledWith({});
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
              expect(lib.conversation.getChannels).to.have.been.calledWith({});
              expect(json).to.deep.equal(result);
              done();
            }
          };
        }
      });
    });
  });

  describe('The findMyPrivateConversations', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findMyPrivateConversations({user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.findPrivateByMembers result calledWith exactMatch === false and authenticated user as a member', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findMyPrivateConversations({query: {members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.calledWith(CONVERSATION_TYPE.PRIVATE, false, ['id']);
              expect(json).to.equal(result);
              done();
            }
          };
        }
      });
    });
  });

  describe('The findMyCommunityConversations', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findMyCommunityConversations({user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.findPrivateByMembers result calledWith exactMatch === false and authenticated user as a member', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findMyCommunityConversations({query: {members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.calledWith(CONVERSATION_TYPE.COMMUNITY, false, ['id']);
              expect(json).to.equal(result);
              done();
            }
          };
        }
      });
    });
  });

  describe('leaveConversation', function() {
    it('shoud send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.leaveConversation({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.conversation.removeMemberFromConversation).to.have.been.calledWith('channelId', 'id');
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('shoud send back HTTP 204 when lib.leaveConversation success', function(done) {
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.leaveConversation({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(204);
          return {
            end: function() {
              expect(lib.conversation.removeMemberFromConversation).to.have.been.calledWith('channelId', 'id');
              done();
            }
          };
        }
      });
    });
  });

  describe('joinConversation', function() {
    it('shoud send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.joinConversation({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.conversation.addMemberToConversation).to.have.been.calledWith('channelId', 'id');
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('shoud send back HTTP 204 when lib.joinConversation success', function(done) {
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.joinConversation({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(204);
          return {
            end: function() {
              expect(lib.conversation.addMemberToConversation).to.have.been.calledWith('channelId', 'id');
              done();
            }
          };
        }
      });
    });
  });

  describe('The findPrivateByMembers', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findPrivateByMembers({query: {members: 'id'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.findPrivateByMembers result calledWith exactMatch === true', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findPrivateByMembers({query: {members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.calledWith(CONVERSATION_TYPE.PRIVATE, true);
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
      controller.findPrivateByMembers({query: {members: ['1', '2']}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.calledWith(CONVERSATION_TYPE.PRIVATE, true, ['1', '2', 'id']);
              done();
            }
          };
        }
      });
    });

    it('should handle query with just one member and add auth user as a member', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findPrivateByMembers({query: {members: '1'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.calledWith(CONVERSATION_TYPE.PRIVATE, true, ['1', 'id']);
              done();
            }
          };
        }
      });
    });

    it('should not add auth user if already passed as membres arguments', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findPrivateByMembers({query: {members: ['1', 'id']}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.calledWith(CONVERSATION_TYPE.PRIVATE, true, ['1', 'id']);
              done();
            }
          };
        }
      });
    });
  });

  describe('The findPrivateByMembers', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findPrivateByMembers({query: {members: 'id'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.findPrivateByMembers result calledWith exactMatch === true', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findPrivateByMembers({query: {members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.calledWith(CONVERSATION_TYPE.PRIVATE, true);
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
      controller.findPrivateByMembers({query: {members: ['1', '2']}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.calledWith(CONVERSATION_TYPE.PRIVATE, true, ['1', '2', 'id']);
              done();
            }
          };
        }
      });
    });

    it('should handle query with just one member and add auth user as a member', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findPrivateByMembers({query: {members: '1'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.calledWith(CONVERSATION_TYPE.PRIVATE, true, ['1', 'id']);
              done();
            }
          };
        }
      });
    });

    it('should not add auth user if already passed as membres arguments', function(done) {
      result = {};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.findPrivateByMembers({query: {members: ['1', 'id']}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(json) {
              expect(lib.conversation.findConversationByTypeAndByMembers).to.have.been.calledWith(CONVERSATION_TYPE.PRIVATE, true, ['1', 'id']);
              done();
            }
          };
        }
      });
    });
  });

  describe('The createConversation function', function() {

    it('should call the api with right parameters', function(done) {
      var name = 'MyChannel';
      var topic = 'MyTopic';
      var purpose = 'MyPurpose';
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.createConversation({
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
            expect(lib.conversation.createConversation).to.have.been.calledWith({
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
      controller.createConversation({
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
            expect(lib.conversation.createConversation).to.have.been.calledWith(sinon.match({
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
      controller.createConversation(req, {
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

    it('should send back HTTP 403 if request try to create a commnity conversation', function(done) {
      err = new Error('failed');
      var req = {body: {type: CONVERSATION_TYPE.COMMUNITY}, query: {}, user: user};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.createConversation(req, {
        status: function(code) {
          expect(code).to.equal(403);
          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 403}});
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
      controller.createConversation(req, {
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

    it('should send back previous channel if channel existed', function(done) {
      var channel = {id: 1, members: ['user1']};
      result = [channel, {id: 2}];
      var query = {
        body: {
          members: ['user1']
        }
      };
      var req = {body: {}, query: query, user: user};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.createConversation(req, {
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
      var topic = {
        value: 'topic',
        creator: user._id,
        last: new Date()
      };
      result = topic;
      var req = {body: topic, params: {id: channel.id}, query: {}, user: user};
      var controller = require('../../../../backend/webserver/api/controller')(this.moduleHelpers.dependencies, lib);
      controller.updateTopic(req, {
        status: function(code) {
          expect(code).to.be.equal(200);
          return {
            json: function(json) {
              expect(json).to.be.deep.equal(topic);
              done();
            }
          };
        }
      });
    });
  });
});
