(function() {
  'use strict';

  angular.module('linagora.esn.chat')

    .controller('chatConversationsSearchItemController', function() {
      var self = this;

      self.$onInit = $onInit;

      /////

      function $onInit() {
        var item = self.resultItem;

        self.id = item._id;
        self.name = item.name || '';
        self.topic = item.topic ? item.topic.value : '';
        self.purpose = item.purpose ? item.purpose.value : '';
        self.creationDate = item.timestamps.creation;
      }
    });

})();
