(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .factory('chatMessageStarService', chatMessageStarService);

  function chatMessageStarService(ResourceLinkAPI, session, CHAT_OBJECT_TYPES, STAR_LINK_TYPE) {

    return {
      star: star,
      unstar: unstar
    };

    function _getSource() {
      return {
        objectType: 'user',
        id: session.user._id
      };
    }

    function _getTarget(messageId) {
      return {
        objectType: CHAT_OBJECT_TYPES.MESSAGE,
        id: messageId
      };
    }

    function star(messageId) {
      return ResourceLinkAPI.create(_getSource(), _getTarget(messageId), STAR_LINK_TYPE);
    }

    function unstar(messageId) {
      return ResourceLinkAPI.remove(_getSource(), _getTarget(messageId), STAR_LINK_TYPE);
    }
  }
})();
