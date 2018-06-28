'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');
const _ = require('lodash');
const Q = require('q');
const CONSTANTS = require('../../../../backend/lib/constants');
const CONVERSATION_TYPE = CONSTANTS.CONVERSATION_TYPE;
const CONVERSATION_MODE = CONSTANTS.CONVERSATION_MODE;

describe('The conversation controller', function() {

  let lib, err, result, user, attachmentsForConversationErr, attachmentsForConversationResult, newestMembersResult;

  beforeEach(function() {
    err = undefined;
    result = undefined;
    user = {_id: 1, firstname: 'aFirstname', lastname: 'aLastname'};

    attachmentsForConversationResult = undefined;
    attachmentsForConversationErr = undefined;
    newestMembersResult = undefined;

    lib = {
      members: {
        addMember: sinon.spy(function(conversation, author, memberId, callback) {
          return callback(err, result);
        }),
        getMembers: sinon.spy(function(collaboration) {
          return Q.when(collaboration.members || []);
        }),
        isMember: function() {
          return Q.when(true);
        },
        countMembers: function() {
          return Q.when(1);
        },
        getNewestMembers: function() {
          return Q.when(newestMembersResult);
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
      },
      search: {
        conversations: {
          search: {}
        }
      },
      message: {
        getAttachmentsForConversation: sinon.spy(function(conversationId, query, callback) {
          return callback(attachmentsForConversationErr, attachmentsForConversationResult);
        })
      }
    };
  });

  function getController(dependencies, lib) {
    return require('../../../../backend/webserver/controllers/conversation')(dependencies, lib);
  }

  describe('The addMember', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.addMember({ params: {} }, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(lib.members.addMember).to.have.been.called;
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

      controller.addMember({ params: {} }, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.members.addMember).to.have.been.called;
              expect(json).to.deep.equal(result);
              done();
            }
          };
        }
      });
    });
  });

  describe('The getUserConversations', function() {
    it('should send back HTTP 500 with error when error is sent back from lib', function(done) {
      err = new Error('failed');
      const controller = getController(this.moduleHelpers.dependencies, lib);
      const req = { user: { _id: 'id' }, query: {} };

      controller.getUserConversations(req, {
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
      const req = { user: { _id: 'id' }, query: {} };

      controller.getUserConversations(req, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.calledWith({
                ignoreMemberFilterForChannel: false,
                mode: CONVERSATION_MODE.CHANNEL,
                members: [{ member: { objectType: 'user', id: 'id' } }],
                populations: { lastMessageCreator: true, lastMessageMentionedUsers: true },
                sort: { [CONSTANTS.SORT_FIELDS.CONVERSATION.lastMessageDate]: CONSTANTS.SORT_TYPE.ASC }
              });
              expect(json).to.deep.equal(result);
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 with the unread conversations if unread query param is "true"', function(done) {
      result = [];
      const controller = getController(this.moduleHelpers.dependencies, lib);
      const req = { user: { _id: 'id' }, query: { unread: 'true' } };

      controller.getUserConversations(req, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.calledWith({
                ignoreMemberFilterForChannel: false,
                mode: CONVERSATION_MODE.CHANNEL,
                members: [{ member: { objectType: 'user', id: 'id' } }],
                unread: true
              });
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
              domain_ids: [domain],
              creator: user._id,
              avatar: avatar,
              topic: {
                value: topic,
                creator: user._id
              },
              purpose: {
                value: purpose,
                creator: user._id
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
      const channel = {id: 1, members: [String(user._id), 'user1']};
      const req = {
        body: { members: ['user1'] },
        user: user
      };
      const controller = getController(this.moduleHelpers.dependencies, lib);

      result = [channel];
      controller.create(req, {
        status: function(code) {
          expect(code).to.equal(201);

          return {
            json: function(json) {
              expect(lib.conversation.find).to.have.been.calledWith(sinon.match({
                members: [
                  { member: { id: 'user1', objectType: CONSTANTS.OBJECT_TYPES.USER } },
                  { member: { id: String(user._id), objectType: CONSTANTS.OBJECT_TYPES.USER } }
                ],
                populations: { lastMessageCreator: true, lastMessageMentionedUsers: true }
              }));
              expect(lib.conversation.create).to.not.have.been.called;
              expect(json).to.deep.equal(channel);
              done();
            }
          };
        }
      });
    });
  });

  describe('The list function', function() {
    let headerSpy, conversations, user, searchResult, listResult, error;

    beforeEach(function() {
      error = new Error('I failed');
      headerSpy = sinon.spy();
      conversations = [{_id: 1}, {_id: 2}];
      user = {_id: 'userId', preferredDomainId: '123'};
      searchResult = {total_count: 2, list: [{_id: 3}, {_id: 4}]};
      listResult = {total_count: 2, list: [{_id: 3}, {_id: 4}]};
    });

    describe('when req.query.search', function() {
      it('should search public conversations', function(done) {
        const req = {user: user, query: {search: 'searchme', limit: 20, offset: 20}};
        const res = {
          header: headerSpy
        };

        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback(null, {_id: id});
        });

        lib.conversation.getAllForUser = sinon.spy(function() {
          return Q.resolve(conversations);
        });

        lib.search.conversations.search.searchConversations = sinon.spy(function(search, ids, callback) {
          callback(null, searchResult);
        });

        const sendConversationResult = function(list, user) {
          expect(list).to.shallowDeepEqual(searchResult.list);
          expect(user).to.equal(user);
          expect(headerSpy).to.have.been.calledWith('X-ESN-Items-Count', searchResult.total_count);
          expect(lib.conversation.getById).to.have.been.calledTwice;
          expect(lib.search.conversations.search.searchConversations).to.have.been.calledWith({search: req.query.search, limit: req.query.limit, offset: req.query.offset}, ['1', '2'], sinon.match.func);
          expect(lib.conversation.getAllForUser).to.have.been.calledWith(user);
          done();
        };

        mockery.registerMock('./utils', function() {
          return {
            sendConversationResult: sendConversationResult
          };
        });

        getController(this.moduleHelpers.dependencies, lib).list(req, res);
      });

      it('should HTTP 500 when get current user conversations rejects', function(done) {
        const sendConversationResult = sinon.spy();
        const req = {user: user, query: {search: 'searchme'}};
        const res = {
          header: headerSpy,
          status: function(code) {
            expect(code).to.equal(500);

            return {
              json: function(json) {
                expect(json).to.shallowDeepEqual({
                  error: {
                    code: 500,
                    message: 'Server Error',
                    details: error.message
                  }
                });

                expect(sendConversationResult).to.not.have.been.called;
                expect(headerSpy).to.not.have.been.called;
                expect(lib.conversation.getAllForUser).to.have.been.calledWith(user);
                expect(lib.search.conversations.search.searchConversations).to.not.have.been.called;
                done();
              }
            };
          }
        };

        lib.conversation.getAllForUser = sinon.spy(function() {
          return Q.reject(error);
        });
        lib.search.conversations.search.searchConversations = sinon.spy();

        mockery.registerMock('./utils', function() {
          return {
            sendConversationResult: sendConversationResult
          };
        });

        getController(this.moduleHelpers.dependencies, lib).list(req, res);
      });

      it('should HTTP 500 when searchConversations rejects', function(done) {
        const sendConversationResult = sinon.spy();
        const req = {user: user, query: {search: 'searchme', limit: 20, offset: 20}};
        const res = {
          header: headerSpy,
          status: function(code) {
            expect(code).to.equal(500);

            return {
              json: function(json) {
                expect(json).to.shallowDeepEqual({
                  error: {
                    code: 500,
                    message: 'Server Error',
                    details: error.message
                  }
                });

                expect(sendConversationResult).to.not.have.been.called;
                expect(headerSpy).to.not.have.been.called;
                expect(lib.conversation.getAllForUser).to.have.been.calledWith(user);
                expect(lib.search.conversations.search.searchConversations).to.have.been.calledWith({search: req.query.search, limit: req.query.limit, offset: req.query.offset}, ['1', '2'], sinon.match.func);
                done();
              }
            };
          }
        };

        lib.conversation.getAllForUser = sinon.spy(function() {
          return Q.resolve(conversations);
        });
        lib.search.conversations.search.searchConversations = sinon.spy(function(query, ids, callback) {
          callback(error);
        });

        mockery.registerMock('./utils', function() {
          return {
            sendConversationResult: sendConversationResult
          };
        });

        getController(this.moduleHelpers.dependencies, lib).list(req, res);
      });

      it('should HTTP 500 when lib.conversation.getById rejects', function(done) {
        const sendConversationResult = sinon.spy();
        const req = {user: user, query: {search: 'searchme', limit: 20, offset: 20}};
        const res = {
          header: headerSpy,
          status: function(code) {
            expect(code).to.equal(500);

            return {
              json: function(json) {
                expect(json).to.shallowDeepEqual({
                  error: {
                    code: 500,
                    message: 'Server Error',
                    details: error.message
                  }
                });

                expect(sendConversationResult).to.not.have.been.called;
                expect(headerSpy).to.not.have.been.called;
                expect(lib.conversation.getAllForUser).to.have.been.calledWith(user);
                expect(lib.search.conversations.search.searchConversations).to.have.been.calledWith({search: req.query.search, limit: req.query.limit, offset: req.query.offset}, ['1', '2'], sinon.match.func);
                expect(lib.conversation.getById).to.have.been.called;
                done();
              }
            };
          }
        };

        lib.conversation.getById = sinon.spy(function(id, callback) {
          callback(error);
        });
        lib.conversation.getAllForUser = sinon.spy(function() {
          return Q.resolve(conversations);
        });
        lib.search.conversations.search.searchConversations = sinon.spy(function(query, ids, callback) {
          callback(null, searchResult);
        });

        mockery.registerMock('./utils', function() {
          return {
            sendConversationResult: sendConversationResult
          };
        });

        getController(this.moduleHelpers.dependencies, lib).list(req, res);
      });
    });

    describe('When !req.query.search', function() {
      it('should return the conversations from lib.conversation.list', function(done) {
        const req = {user: user, query: {limit: 10}};
        const res = {
          header: headerSpy
        };

        lib.conversation.list = sinon.spy(function(query, callback) {
          callback(null, listResult);
        });

        const sendConversationResult = function(list, user) {
          expect(list).to.equal(listResult.list);
          expect(user).to.equal(user);
          expect(headerSpy).to.have.been.calledWith('X-ESN-Items-Count', listResult.total_count);
          expect(lib.conversation.list).to.have.been.calledWith({domain_ids: '123', mode: 'channel', type: 'open', limit: req.query.limit}, sinon.match.func);
          done();
        };

        mockery.registerMock('./utils', function() {
          return {
            sendConversationResult: sendConversationResult
          };
        });

        getController(this.moduleHelpers.dependencies, lib).list(req, res);
      });

      it('should HTTP 500 when lib.conversation.list fails', function(done) {
        const sendConversationResult = sinon.spy();
        const req = {user: user, query: {limit: 10}};
        const res = {
          header: headerSpy,
          status: function(code) {
            expect(code).to.equal(500);

            return {
              json: function(json) {
                expect(json).to.deep.equals({
                  error: {
                    code: 500,
                    message: 'Server Error',
                    details: error.message
                  }
                });

                expect(sendConversationResult).to.not.have.been.called;
                expect(headerSpy).to.not.have.been.called;
                expect(lib.conversation.list).to.have.been.calledWith({domain_ids: '123', mode: 'channel', type: 'open', limit: req.query.limit}, sinon.match.func);
                done();
              }
            };
          }
        };

        lib.conversation.list = sinon.spy(function(query, callback) {
          callback(error);
        });

        mockery.registerMock('./utils', function() {
          return {
            sendConversationResult: sendConversationResult
          };
        });

        getController(this.moduleHelpers.dependencies, lib).list(req, res);
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

  describe('The getSummaryOfConversation function', function() {

    let conversationResult, userModule, denormalizeUser;

    beforeEach(function() {
      userModule = {
        get: sinon.spy(function(userId, callback) {
          callback(null, user);
        })
      };
      this.moduleHelpers.addDep('user', userModule);

      denormalizeUser = {
        denormalize: sinon.spy(function(user) {
          return Q.when(user);
        })
      };
      this.moduleHelpers.addDep('denormalizeUser', denormalizeUser);
    });

    it('should send back HTTP 404 with error when conversation not found', function(done) {
      const req = {body: {}, params: {id: 'channelId'}, query: {}, user: user};

      conversationResult = undefined;

      attachmentsForConversationResult = [
        { _id: '59b12a42d3b81465105343d3',
          message_id: '59b12a43d3b81465105343d5',
          creator: '591c24736fb6de734e550137',
          creation_date: '2017-09-07T11:15:15.098Z',
          name: 'test1',
          contentType: 'application/octet-stream',
          length: 487
        },
        { _id: '59b12010de255f5afaf9d927',
          message_id: '59b12010de255f5afaf9d929',
          creator: '591c24736fb6de734e550137',
          creation_date: '2017-09-07T10:31:44.986Z',
          name: 'test2',
          contentType: 'application/octet-stream',
          length: 517
        }
      ];

      newestMembersResult = [
        { timestamps:
          { creation: '2017-07-19T13:06:54.155Z' },
          _id: '596f596e8407fd0a24b63131',
          member:
          { lastname: 'Doe1',
            firstname: 'John1',
            _id: '591c24746fb6de734e55013e' }
        },
        { timestamps:
          { creation: '2017-07-19T13:07:02.971Z' },
          _id: '596f59768407fd0a24b63135',
          status: 'joined',
          member:
          { lastname: 'admin',
            firstname: 'admin',
            _id: '591c24736fb6de734e550137' }
        },
        { timestamps:
          { creation: '2017-09-06T10:38:34.057Z' },
            _id: '59afd02a6529493f1478304e',
            status: 'joined',
            member:
          { lastname: 'Doe10',
            firstname: 'John10',
            _id: '591c24746fb6de734e550147' }
        }];

      newestMembersResult.total_count = 3;

      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback(null, conversationResult);
      });

      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getSummaryOfConversation(req, {
        status: function(code) {
          expect(code).to.equal(404);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual({error: {code: 404, message: 'Not Found', details: 'Conversation not found'}});
              done();
            }
          };
        }
      });
    });

    it('should send back HTTP 200 when request succeed', function(done) {
      const req = {body: {}, params: {id: 'channelId'}, query: {}, user: user};

      conversationResult = {name: 'aConversationName', topic: {value: 'aTopic'}, purpose: {value: 'aValue'}, timestamps: {creation: '2017-09-07T11:15:15.098Z'}, creator: '596f596e8407fd0a24b63131'};

      attachmentsForConversationResult = [
        { _id: '59b12a42d3b81465105343d3',
          message_id: '59b12a43d3b81465105343d5',
          creator: '591c24736fb6de734e550137',
          creation_date: '2017-09-07T11:15:15.098Z',
          name: 'test1',
          contentType: 'application/octet-stream',
          length: 487
        },
        { _id: '59b12010de255f5afaf9d927',
          message_id: '59b12010de255f5afaf9d929',
          creator: '591c24736fb6de734e550137',
          creation_date: '2017-09-07T10:31:44.986Z',
          name: 'test2',
          contentType: 'application/octet-stream',
          length: 517
        }
      ];

      newestMembersResult = [
        { timestamps:
          { creation: '2017-07-19T13:06:54.155Z' },
          _id: '596f596e8407fd0a24b63131',
          member:
          { lastname: 'Doe1',
            firstname: 'John1',
            _id: '591c24746fb6de734e55013e' }
        },
        { timestamps:
          { creation: '2017-07-19T13:07:02.971Z' },
          _id: '596f59768407fd0a24b63135',
          status: 'joined',
          member:
          { lastname: 'admin',
            firstname: 'admin',
            _id: '591c24736fb6de734e550137' }
        },
        { timestamps:
          { creation: '2017-09-06T10:38:34.057Z' },
            _id: '59afd02a6529493f1478304e',
            status: 'joined',
            member:
          { lastname: 'Doe10',
            firstname: 'John10',
            _id: '591c24746fb6de734e550147' }
        }];

      const expectedResult = {
        creator: 'aFirstname aLastname',
        creationDate: '2017-09-07T11:15:15.098Z',
        name: 'aConversationName',
        topic: 'aTopic',
        purpose: 'aValue',
        members: [{ _id: 1 }, { _id: 1 }, { _id: 1 }],
        memberCount: 3,
        attachments:
        [{ _id: '59b12a42d3b81465105343d3',
        message_id: '59b12a43d3b81465105343d5',
        creator: { _id: 1 },
        creation_date: '2017-09-07T11:15:15.098Z',
        name: 'test1',
        contentType: 'application/octet-stream',
        length: 487 },
        { _id: '59b12010de255f5afaf9d927',
        message_id: '59b12010de255f5afaf9d929',
        creator: { _id: 1 },
        creation_date: '2017-09-07T10:31:44.986Z',
        name: 'test2',
        contentType: 'application/octet-stream',
        length: 517 }]
      };

      newestMembersResult.total_count = 3;

      lib.conversation.getById = sinon.spy(function(id, callback) {
        callback(null, conversationResult);
      });

      const controller = getController(this.moduleHelpers.dependencies, lib);

      controller.getSummaryOfConversation(req, {
        status: function(code) {
          expect(code).to.equal(200);

          return {
            json: function(json) {
              expect(json).to.shallowDeepEqual(expectedResult);
              done();
            }
          };
        }
      });
    });

  });

});
