'use strict';

var sinon = require('sinon');
var mockery = require('mockery');
var expect = require('chai').expect;

describe('The first channel message handler', function() {

  var deps, listener, globalPublish, dependencies, data;
  var channelId = '1234';
  var creator = {_id: '5678'};

  beforeEach(function() {
    data = {
      message: {
        creator: creator,
        channel: channelId
      }
    };

    dependencies = function(name) {
      return deps[name];
    };

    globalPublish = sinon.spy();
    deps = {
      logger: {
        error: console.log,
        info: console.log,
        debug: console.log
      },
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

  it('should do nothing when can not count messages in channel', function() {
    var countSpy = sinon.spy();
    var getSpy = sinon.spy();

    mockery.registerMock('../../../message', function() {
      return {
        count: function(channel, callback) {
          countSpy(channel);
          callback(new Error('Count failure'));
        }
      };
    });

    mockery.registerMock('../../../conversation', function() {
      return {
        getById: getSpy
      };
    });

    require('../../../../../../backend/lib/listener/message/handlers/first')(dependencies)(data);
    expect(getSpy).to.not.have.been.called;
    expect(countSpy).to.have.been.calledWith(channelId);
    expect(globalPublish).to.not.have.been.called;
  });

  it('should do nothing when number of messages is 0', function() {
    var countSpy = sinon.spy();
    var getSpy = sinon.spy();

    mockery.registerMock('../../../message', function() {
      return {
        count: function(channel, callback) {
          countSpy(channel);
          callback(null, 0);
        }
      };
    });

    mockery.registerMock('../../../conversation', function() {
      return {
        getById: getSpy
      };
    });

    require('../../../../../../backend/lib/listener/message/handlers/first')(dependencies)(data);
    expect(getSpy).to.not.have.been.called;
    expect(countSpy).to.have.been.calledWith(channelId);
    expect(globalPublish).to.not.have.been.called;
  });

  it('should do nothing when number of messages is > 1', function() {
    var countSpy = sinon.spy();
    var getSpy = sinon.spy();

    mockery.registerMock('../../../message', function() {
      return {
        count: function(channel, callback) {
          countSpy(channel);
          callback(null, 2);
        }
      };
    });

    mockery.registerMock('../../../conversation', function() {
      return {
        countMessages: function(channel, callback) {
          countSpy(channel);
          callback(null, 2);
        },
        getById: getSpy
      };
    });

    require('../../../../../../backend/lib/listener/message/handlers/first')(dependencies)(data);
    expect(getSpy).to.not.have.been.called;
    expect(countSpy).to.have.been.calledWith(channelId);
    expect(globalPublish).to.not.have.been.called;
  });

  it('should not notify when conversation can not be retrieved', function() {
    var countSpy = sinon.spy();
    var getSpy = sinon.spy();

    mockery.registerMock('../../../message', function() {
      return {
        count: function(channel, callback) {
          countSpy(channel);
          callback(null, 1);
        }
      };
    });

    mockery.registerMock('../../../conversation', function() {
      return {
        getById: function(channel, callback) {
          getSpy(channel);
          callback(new Error('Get conversation failure'));
        }
      };
    });

    require('../../../../../../backend/lib/listener/message/handlers/first')(dependencies)(data);
    expect(getSpy).to.have.been.calledWith(channelId);
    expect(countSpy).to.have.been.calledWith(channelId);
    expect(globalPublish).to.not.have.been.called;
  });

  it('should not notify message creator when he is the only member', function() {
    var countSpy = sinon.spy();
    var getSpy = sinon.spy();

    mockery.registerMock('../../../message', function() {
      return {
        count: function(channel, callback) {
          countSpy(channel);
          callback(null, 1);
        }
      };
    });

    mockery.registerMock('../../../conversation', function() {
      return {
        getById: function(channel, callback) {
          getSpy(channel);
          callback(null, {members: [{_id: creator._id}]});
        }
      };
    });

    require('../../../../../../backend/lib/listener/message/handlers/first')(dependencies)(data);
    expect(getSpy).to.have.been.calledWith(channelId);
    expect(countSpy).to.have.been.calledWith(channelId);
    expect(globalPublish).to.not.have.been.called;
  });

  it('should notify all members except the message creator', function() {
    var countSpy = sinon.spy();
    var getSpy = sinon.spy();
    var data = {
      message: {
        creator: creator,
        channel: channelId
      }
    };

    mockery.registerMock('../../../message', function() {
      return {
        count: function(channel, callback) {
          countSpy(channel);
          callback(null, 1);
        }
      };
    });

    mockery.registerMock('../../../conversation', function() {
      return {
        getById: function(channel, callback) {
          getSpy(channel);
          callback(null, {
            members: [{_id: creator._id}, {_id: 1}, {_id: 2}],
            toObject: function() {
              return this;
            }
          });
        }
      };
    });

    require('../../../../../../backend/lib/listener/message/handlers/first')(dependencies)(data);
    expect(getSpy).to.have.been.calledWith(channelId);
    expect(countSpy).to.have.been.calledWith(channelId);
    expect(globalPublish).to.have.been.calledTwice;
  });
});
