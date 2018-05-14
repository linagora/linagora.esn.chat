'use strict';

const mockery = require('mockery');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('The chat mentions handler', function() {
  let dependencies;

  beforeEach(function() {
    dependencies = () => {};
  });

  const getModule = () => require('../../../../../../backend/lib/listener/message/handlers/mentions')(dependencies);

  it('should do nothing if conversation is not found', function(done) {
    const conversationId = '123';
    const message = {
      channel: conversationId,
      user_mentions: [{}]
    };
    const getSpy = sinon.spy();
    const increaseNumberOfUnseenMentionsOfMembersSpy = sinon.spy();

    mockery.registerMock('../../../conversation', () => ({
      getById: (conversationId, callback) => {
        getSpy(conversationId);

        callback(null);
      },
      increaseNumberOfUnseenMentionsOfMembers: increaseNumberOfUnseenMentionsOfMembersSpy
    }));

    getModule()({ message })
      .catch(() => {
        expect(getSpy).to.have.been.calledWith(conversationId);
        expect(increaseNumberOfUnseenMentionsOfMembersSpy).to.not.have.been.called;
        done();
      });
  });

  it('should do nothing if there is no mentions in the sent message', function(done) {
    const conversationId = '123';
    const message = {
      channel: conversationId,
      user_mentions: []
    };
    const getSpy = sinon.spy();
    const increaseNumberOfUnseenMentionsOfMembersSpy = sinon.spy();

    mockery.registerMock('../../../conversation', () => ({
      getById: (conversationId, callback) => {
        getSpy(conversationId);

        callback(null, {
          members: []
        });
      },
      increaseNumberOfUnseenMentionsOfMembers: increaseNumberOfUnseenMentionsOfMembersSpy
    }));

    getModule()({ message })
      .then(() => {
        expect(getSpy).to.not.have.been.called;
        expect(increaseNumberOfUnseenMentionsOfMembersSpy).to.not.have.been.called;
        done();
      });
  });

  it('should do nothing if the sent message mentioned users who are not the members ', function(done) {
    const user = { _id: 'userId' };
    const conversationId = '123';
    const message = {
      channel: conversationId,
      user_mentions: [user]
    };
    const getSpy = sinon.spy();
    const increaseNumberOfUnseenMentionsOfMembersSpy = sinon.spy();

    mockery.registerMock('../../../conversation', () => ({
      getById: (conversationId, callback) => {
        getSpy(conversationId);

        callback(null, {
          members: []
        });
      },
      increaseNumberOfUnseenMentionsOfMembers: increaseNumberOfUnseenMentionsOfMembersSpy
    }));

    getModule()({ message })
      .then(() => {
        expect(getSpy).to.have.been.calledWith(conversationId);
        expect(increaseNumberOfUnseenMentionsOfMembersSpy).to.not.have.been.called;
        done();
      });
  });

  it('should call lib.conversation.increaseNumberOfUnseenMentionsOfMembers to increase unseen mention counts of members', function(done) {
    const user = { _id: 'userId' };
    const conversationId = '123';
    const message = {
      channel: conversationId,
      user_mentions: [user]
    };
    const getSpy = sinon.spy();
    const increaseNumberOfUnseenMentionsOfMembersSpy = sinon.spy();

    mockery.registerMock('../../../conversation', () => ({
      getById: (conversationId, callback) => {
        getSpy(conversationId);

        callback(null, {
          members: [{ member: { id: user._id } }]
        });
      },
      increaseNumberOfUnseenMentionsOfMembers: increaseNumberOfUnseenMentionsOfMembersSpy
    }));

    getModule()({ message })
      .then(() => {
        expect(getSpy).to.have.been.calledWith(conversationId);
        expect(increaseNumberOfUnseenMentionsOfMembersSpy).to.have.been.calledWith(conversationId, [user._id]);
        done();
      });
  });
});
