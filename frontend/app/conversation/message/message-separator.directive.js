(function() {
  'use strict';

  angular
    .module('linagora.esn.chat')
    .directive('chatMessageSeparator', chatMessageSeparator);

  function chatMessageSeparator() {
    var directive = {
      restrict: 'E',
      scope: {
        prevMessage: '=?',
        currentMessage: '='
      },
      templateUrl: '/chat/app/conversation/message/message-separator.html',
      controller: chatMessageSeparatorController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  chatMessageSeparatorController.$inject = ['moment'];

  function chatMessageSeparatorController(moment) {
    var self = this;

    self.sameDay = sameDay;
    self.diffDate = diffDate;
    self.formatDate = formatDate;

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
