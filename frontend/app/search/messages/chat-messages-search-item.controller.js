(function() {
  'use strict';

  angular.module('linagora.esn.chat')

    .controller('chatMessagesSearchItemController', function(userUtils) {
      var self = this;

      self.$onInit = $onInit;

      /////

      function $onInit() {
        var item = self.resultItem;

        self.creatorId = item.creator._id;
        self.creator = item.creator && {
          id: item.creator._id,
          displayName: userUtils.displayNameOf(item.creator)
        };
        self.channel = item.channel && {
            id: item.channel._id,
            name: item.channel.name
        };
        self.creationDate = item.timestamps && item.timestamps.creation;
        self.text = item && item.text;
      }
    });

})();
