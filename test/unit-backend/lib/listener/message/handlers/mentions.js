'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var _ = require('lodash');
var CONSTANTS = require('../../../../../../backend/lib/constants');

describe('The chat mentions handler', function() {

  var deps, listener, globalPublish, ChatMessageMock, dependencies;

  beforeEach(function() {
    dependencies = function(name) {
      return deps[name];
    };

    ChatMessageMock = sinon.spy(function() {
      this.populate = ChatMessageMock.populate;
    });

    ChatMessageMock.populate = sinon.spy(_.identity);

    globalPublish = sinon.spy();
    deps = {
      pubsub: {
        local: {
          topic: function() {
            return {
              subscribe: function(cb) {
                listener = cb;
              }
            };
          }
        },
        global: {
          topic: sinon.spy(function() {
            return {
              publish: globalPublish
            };
          })
        }
      }
    };
  });

  it('should broadcast users_mention', function() {
    var message = {user_mentions: ['user']};
    var room = 1;
    require('../../../../../../backend/lib/listener/message/handlers/mentions')(dependencies)({room: room, message: message});
    expect(globalPublish).to.have.been.calledWith({room: room, message: message, for: 'user'});
    expect(deps.pubsub.global.topic).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.USERS_MENTION);
  });
});
