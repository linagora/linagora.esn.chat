'use strict';
/*eslint no-unused-vars: ["error", {"args": "after-used"}]*/

let expect = require('chai').expect;
let sinon = require('sinon');
let _ = require('lodash');
let CONSTANTS = require('../../../../backend/lib/constants');
let CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;

describe('The conversation controller', function() {

  let lib, err, result, user;

  beforeEach(function() {
    err = undefined;
    result = undefined;
    user = {_id: 1};

    lib = {
      conversation: {
        getConversationByCommunityId: sinon.spy(function(id, callback) {
          return callback(err, result);
        }),
        getChannels: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        create: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        find: sinon.spy(function(options, callback) {
          return callback(err, result);
        }),
        removeMember: sinon.spy(function(channelId, userId, callback) {
          return callback(err, result);
        }),
        addMember: sinon.spy(function(channelId, userId, callback) {
          return callback(err, result);
        }),
        updateTopic: sinon.spy(function(channelId, topic, callback) {
          return callback(err, result);
        })
      }
    };
  });

  function getController(dependencies, lib) {
    return require('../../../../backend/webserver/controllers/conversation')(dependencies, lib);
  }

  describe('The findMyConversations', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.findMyPrivateConversations({user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.findConversationByTypeAndByMembers result calledWith exactMatch === false and authenticated user as a member', function(done) {
      result = {};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.findMyConversations({query: {type: 'type'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.calledWith({type: 'type', ignoreMemberFilterForChannel: true, members: ['id']});
              expect(json).to.equal(result);
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
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.findMyPrivateConversations({user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.called;
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

      controller.findMyPrivateConversations({query: {members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.PRIVATE, ignoreMemberFilterForChannel: true, members: ['id']});
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
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.leaveConversation({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.conversation.removeMember).to.have.been.calledWith('channelId', 'id');
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('shoud send back HTTP 204 when lib.leaveConversation success', function(done) {
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.leaveConversation({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(204);

          return {
            end: function() {
              expect(lib.conversation.removeMember).to.have.been.calledWith('channelId', 'id');
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
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.joinConversation({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.conversation.addMember).to.have.been.calledWith('channelId', 'id');
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('shoud send back HTTP 204 when lib.joinConversation success', function(done) {
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.joinConversation({params: {id: 'channelId'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(204);

          return {
            end: function() {
              expect(lib.conversation.addMember).to.have.been.calledWith('channelId', 'id');
              done();
            }
          };
        }
      });
    });
  });

  describe('The list', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.list({query: {type: 'private', members: 'id'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.findPrivateByMembers result calledWith exactMatch === true', function(done) {
      result = {};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.list({query: {type: 'private', members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.PRIVATE, ignoreMemberFilterForChannel: true, exactMembersMatch: true, members: [1, 2, 'id']});
              expect(json).to.equal(result);
              done();
            }
          };
        }
      });
    });

    it('should handle query with more than one member and add auth user as a member', function(done) {
      result = {};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.list({query: {type: 'private', members: ['1', '2']}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function() {
              expect(lib.conversation.find).to.have.been.calledWith({
                type: CONVERSATION_TYPE.PRIVATE,
                ignoreMemberFilterForChannel: true,
                exactMembersMatch: true,
                members: ['1', '2', 'id']
              });
              done();
            }
          };
        }
      });
    });

    it('should handle query with just one member and add auth user as a member', function(done) {
      result = {};
      let controller = getController(this.moduleHelpers.dependencies, lib);
      controller.list({query: {type: 'private', members: '1'}, user: {_id: 'id'}}, {

        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function() {
              expect(lib.conversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.PRIVATE, ignoreMemberFilterForChannel: true, exactMembersMatch: true, members: ['1', 'id']});
              done();
            }
          };
        }
      });
    });

    it('should not add auth user if already passed as membres arguments', function(done) {
      result = {};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.list({query: {type: 'private', members: ['1', 'id']}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function() {
              expect(lib.conversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.PRIVATE, ignoreMemberFilterForChannel: true, exactMembersMatch: true, members: ['1', 'id']});
              done();
            }
          };
        }
      });
    });
  });

  describe('The list', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.list({query: {type: 'private', members: 'id'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.called;
              expect(json).to.shallowDeepEqual({error: {code: 500}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the lib.findPrivateByMembers result calledWith exactMatch === true', function(done) {
      result = {};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.list({query: {type: 'private', members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.PRIVATE, ignoreMemberFilterForChannel: true, exactMembersMatch: true, members: [1, 2, 'id']});
              expect(json).to.equal(result);
              done();
            }
          };
        }
      });
    });

    it('should handle query with more than one member and add auth user as a member', function(done) {
      result = {};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.list({query: {type: 'private', members: ['1', '2']}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function() {
              expect(lib.conversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.PRIVATE, exactMembersMatch: true, ignoreMemberFilterForChannel: true, members: ['1', '2', 'id']});
              done();
            }
          };
        }
      });
    });

    it('should handle query with just one member and add auth user as a member', function(done) {
      result = {};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.list({query: {type: 'private', members: '1'}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function() {
              expect(lib.conversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.PRIVATE, exactMembersMatch: true, ignoreMemberFilterForChannel: true, members: ['1', 'id']});
              done();
            }
          };
        }
      });
    });

    it('should not add auth user if already passed as members arguments', function(done) {
      result = {};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.list({query: {type: 'private', members: ['1', 'id']}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function() {
              expect(lib.conversation.find).to.have.been.calledWith({type: CONVERSATION_TYPE.PRIVATE, exactMembersMatch: true, ignoreMemberFilterForChannel: true, members: ['1', 'id']});
              done();
            }
          };
        }
      });
    });
  });

  describe('The create function', function() {

    it('should call the api with right parameters', function(done) {
      let name = 'MyChannel';
      let topic = 'MyTopic';
      let purpose = 'MyPurpose';
      let avatar = 'avatar';
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.create({
        user: user,
        query: {},
        body: {
          name: name,
          type: 'type',
          topic: topic,
          avatar: avatar,
          purpose: purpose
        }
      }, {
        status: _.constant({json: function() {
            expect(lib.conversation.create).to.have.been.calledWith({
              name: name,
              type: 'type',
              creator: user,
              avatar: avatar,
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
      let name = 'MyChannel';
      let topic = 'MyTopic';
      let purpose = 'MyPurpose';
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.create({
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
            expect(lib.conversation.create).to.have.been.calledWith(sinon.match({
              members: ['2', '3', '1']
            }));
            done();
          }})
      });
    });

    it('should send back HTTP 500 with error when channel can not be created', function(done) {
      err = new Error('failed');
      let req = {body: {}, query: {}, user: user};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      controller.create(req, {
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
      let channel = {id: 1};
      let req = {body: {}, query: {}, user: user};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      result = channel;
      controller.create(req, {
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
      let channel = {id: 1, members: ['user1']};
      let query = {
        body: {
          members: ['user1']
        }
      };
      let req = {body: {}, query: query, user: user};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      result = [channel, {id: 2}];
      controller.create(req, {
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
      let req = {body: {}, params: {id: 'channelId'}, query: {}, user: user};
      let controller = getController(this.moduleHelpers.dependencies, lib);

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
      let channel = {id: 1};
      let topic = {
        value: 'topic',
        creator: user._id,
        last: new Date()
      };
      let req = {body: topic, params: {id: channel.id}, query: {}, user: user};
      let controller = getController(this.moduleHelpers.dependencies, lib);

      result = topic;
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
