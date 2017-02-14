'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const _ = require('lodash');
const CONSTANTS = require('../../../../../../backend/lib/constants');

describe('The chat mentions handler', function() {
  let deps, globalPublish, ChatMessageMock, dependencies;

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
              subscribe: function() {
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
    const message = {user_mentions: ['user']};

    require('../../../../../../backend/lib/listener/message/handlers/mentions')(dependencies)({message});

    expect(globalPublish).to.have.been.calledWith({message: message, for: 'user'});
    expect(deps.pubsub.global.topic).to.have.been.calledWith(CONSTANTS.NOTIFICATIONS.USERS_MENTION);
  });
});
