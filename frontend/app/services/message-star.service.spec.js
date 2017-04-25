'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatMessageStarService factory', function() {

  var $rootScope, ResourceLinkAPIMock, session, user, message, source, target, chatMessageStarService, CHAT_OBJECT_TYPES, STAR_LINK_TYPE;

  beforeEach(function() {
    user = {_id: 'userId'};
    session = {
      user: user
    };

    message = {
      _id: 'messageId'
    };

    ResourceLinkAPIMock = {
      create: sinon.spy(),
      remove: sinon.spy()
    };
  });

  beforeEach(function() {
    module('linagora.esn.chat', function($provide) {
      $provide.value('searchProviders', {
        add: sinon.spy()
      });
      $provide.value('chatSearchMessagesProviderService', {});
      $provide.value('chatSearchConversationsProviderService', {});
      $provide.value('session', session);
      $provide.value('ResourceLinkAPI', ResourceLinkAPIMock);
    });
  });

  beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _chatMessageStarService_, _CHAT_OBJECT_TYPES_, _STAR_LINK_TYPE_) {
    $rootScope = _$rootScope_;
    chatMessageStarService = _chatMessageStarService_;
    CHAT_OBJECT_TYPES = _CHAT_OBJECT_TYPES_;
    STAR_LINK_TYPE = _STAR_LINK_TYPE_;
  }));

  beforeEach(function() {
    source = {
      objectType: 'user',
      id: session.user._id
    };
    target = {
      objectType: CHAT_OBJECT_TYPES.MESSAGE,
      id: message._id
    };
  });

  describe('The star function', function() {

    it('should create the resource link', function() {
      chatMessageStarService.star(message._id);

      $rootScope.$digest();

      expect(ResourceLinkAPIMock.create).to.be.calledWith(source, target, STAR_LINK_TYPE);
    });
  });

  describe('The unstar function', function() {

    it('should remove the resource link when it exists', function() {
      chatMessageStarService.unstar(message._id);

      $rootScope.$digest();

      expect(ResourceLinkAPIMock.remove).to.be.calledWith(source, target, STAR_LINK_TYPE);
    });
  });
});
