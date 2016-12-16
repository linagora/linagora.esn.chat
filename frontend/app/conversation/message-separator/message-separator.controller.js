(function() {
  'use strict';

  angular.module('linagora.esn.chat')
    .controller('chatMessageSeparatorController', chatMessageSeparatorController);

  function chatMessageSeparatorController(moment) {
    var self = this;

    self.diffDate = diffDate;
    self.formatDate = formatDate;
    self.sameDay = sameDay;

    function diffDate(timestamp) {
      var messageDate = moment(timestamp, 'x');
      var formatDate = [messageDate.year(), messageDate.month(), messageDate.date()];

      return moment().diff(formatDate, 'day');
    }

    function formatDate(timestamp) {
      return moment(timestamp, 'x').format('Do MMMM');
    }

    function sameDay(timestampDate1, timestampDate2) {
      return moment(timestampDate1, 'x').isSame(moment(timestampDate2, 'x'), 'day');
    }
  }
})();
