'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const _ = require('lodash');
const Q = require('q');
const CONSTANTS = require('../../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;

describe('The conversation controller', function() {

  let lib, err, result, user;

  beforeEach(function() {
    err = undefined;
    result = undefined;
    user = {_id: 1};

    lib = {
      members: {
        getMembers: sinon.spy(function(collaboration) {
          return Q.when(collaboration.members || []);
        }),
        isMember: function() {
          return Q.when(true);
        },
        countMembers: function() {
          return Q.when(1);
        }
      },
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

  describe('The getUserConversations', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getUserConversations({user: {_id: 'id'}}, {
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

    it('should send back HTTP 200 with the lib.find result', function(done) {
      result = [];
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getUserConversations({user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.calledWith({ignoreMemberFilterForChannel: true, mode: CONVERSATION_MODE.CHANNEL, type: CONVERSATION_TYPE.OPEN, members: [{member: {objectType: 'user', id: 'id'}}]});
              expect(json).to.deep.equal(result);
              done();
            }
          };
        }
      });
    });
  });

  describe('The getUserPrivateConversations', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getUserPrivateConversations({user: {_id: 'id'}}, {
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

    it('should send back HTTP 200 with the lib.find result calledWith exactMatch === false and authenticated user as a member', function(done) {
      result = [];
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getUserPrivateConversations({query: {members: [1, 2]}, user: {_id: 'id'}}, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.calledWith({mode: CONVERSATION_MODE.CHANNEL, type: CONVERSATION_TYPE.CONFIDENTIAL, members: [{member: {objectType: 'user', id: 'id'}}]});
              expect(json).to.deep.equal(result);
              done();
            }
          };
        }
      });
    });
  });

  describe('The create function', function() {

    it('should call the api with right parameters', function(done) {
      const name = 'MyChannel';
      const topic = 'MyTopic';
      const purpose = 'MyPurpose';
      const avatar = 'avatar';
      const domain = 'domain';
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.create({
        user: user,
        query: {},
        body: {
          name: name,
          mode: 'mode',
          type: 'type',
          domain: domain,
          topic: topic,
          avatar: avatar,
          purpose: purpose
        }
      }, {
        status: _.constant({json: function() {
            expect(lib.conversation.create).to.have.been.calledWith({
              name: name,
              type: 'type',
              mode: 'mode',
              domain: domain,
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
              members: [{member: {objectType: 'user', id: '1'}}]
            });
            done();
          }})
      });
    });

    it('should take into consideration extras members', function(done) {
      const name = 'MyChannel';
      const topic = 'MyTopic';
      const purpose = 'MyPurpose';
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.create({
        user: user,
        body: {
          name: name,
          topic: topic,
          type: 'type',
          mode: 'mode',
          members: ['2', '3'],
          purpose: purpose
        }
      }, {
        status: _.constant({json: function() {
            expect(lib.conversation.create).to.have.been.calledWith(sinon.match({
              members: [
                {member: {objectType: 'user', id: '2'}},
                {member: {objectType: 'user', id: '3'}},
                {member: {objectType: 'user', id: '1'}}
              ]
            }));
            done();
          }})
      });
    });

    it('should send back HTTP 500 with error when channel can not be created', function(done) {
      err = new Error('failed');
      const req = {body: {}, query: {}, user: user};
      const controller = getController(this.moduleHelpers.dependencies, lib);

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
      const channel = {id: 1};
      const req = {body: {}, query: {}, user: user};
      const controller = getController(this.moduleHelpers.dependencies, lib);

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
      const channel = {id: 1, members: ['user1']};
      const query = {
        body: {
          members: ['user1']
        }
      };
      const req = {body: {}, query: query, user: user};
      const controller = getController(this.moduleHelpers.dependencies, lib);

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
      const req = {body: {}, params: {id: 'channelId'}, query: {}, user: user};
      const controller = getController(this.moduleHelpers.dependencies, lib);

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
      const channel = {id: 1};
      const topic = {
        value: 'topic',
        creator: user._id,
        last: new Date()
      };
      const req = {body: topic, params: {id: channel.id}, query: {}, user: user};
      const controller = getController(this.moduleHelpers.dependencies, lib);

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
