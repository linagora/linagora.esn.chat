(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .factory('chatParseMention', chatParseMention);

  function chatParseMention() {
    return function(text, mentions) {
      return (mentions || []).reduce(function(prev, user) {
        return prev.replace(new RegExp('@' + user._id, 'g'), '<a href="#/profile/' + user._id + '/details/view">@' + user.firstname + '.' + user.lastname + '</a>');
      }, text);
    };
  }
})();
