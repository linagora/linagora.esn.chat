'use strict';
/* global chai, sinon: false */

var expect = chai.expect;

describe('linagora.esn.chat run', function() {
  var listenChatWebsocketMock;

  beforeEach(function() {
    listenChatWebsocketMock = {
      initListener: sinon.spy()
    };

    angular.mock.module('linagora.esn.chat', function($provide) {
      $provide.value('listenChatWebsocket', listenChatWebsocketMock);
    });

  });

  beforeEach(angular.mock.inject(function() {
    //Just to force module initialisation
  }));

  it('should call listenChatWebsocket.initListener', function() {
    expect(listenChatWebsocketMock.initListener).to.have.been.called;
  });
});
