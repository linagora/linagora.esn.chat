'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The chatParseMention service', function() {
  var chatParseMention;

  beforeEach(angular.mock.module('linagora.esn.chat'));

  beforeEach(angular.mock.inject(function(_chatParseMention_, _$q_, _$rootScope_) {
    chatParseMention = _chatParseMention_;
  }));

  it('should replace mention with the correct link', function() {
    var user_mentions = [{firstname: 'firstname', lastname: 'lastname', _id: 'abcd'}];
    var abcdMention = '<a href="#/profile/abcd/details/view">@firstname.lastname</a>';
    expect(chatParseMention('Hi @abcd, how are you doing @abcd', user_mentions)).to.equal('Hi ' + abcdMention + ', how are you doing ' + abcdMention);
  });
});
