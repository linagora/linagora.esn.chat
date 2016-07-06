'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The chatParseMention service', function() {
  var $q, chatParseMention, userAPIMock, userResult, $rootScope;

  beforeEach(angular.mock.module('linagora.esn.chat', function($provide) {
    userResult = {firstname: 'firstname', lastname: 'lastname', _id: 'abcd'};
    userAPIMock = {
      user: sinon.spy(function() {
        return $q.when({data: userResult});
      })
    };

    $provide.value('userAPI', userAPIMock);
  }));

  beforeEach(angular.mock.inject(function(_chatParseMention_, _$q_, _$rootScope_) {
    chatParseMention = _chatParseMention_;
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  it('should replace mention with the correct link', function() {
    var thenSpy  = sinon.spy();

    chatParseMention('Hi @abcd, how are you doing').then(thenSpy);
    $rootScope.$digest();
    expect(thenSpy).to.have.been.calledWith('Hi <a href="#/profile/abcd/details/view">@firstname.lastname</a>, how are you doing');
    expect(userAPIMock.user).to.have.been.calledWith('abcd');
  });

  it('should cache user', function() {
    chatParseMention('Hi @abcd, how are you doing');
    $rootScope.$digest();
    chatParseMention('@abcd ?');
    $rootScope.$digest();
    expect(userAPIMock.user).to.have.been.calledOnce;
  });
});
