'use strict';

module.exports = function(dependencies, lib) {

  var logger = dependencies('logger');

  function getMessages(req, res) {
    return res.status(200).json([]);
  }

  function getChannels(req, res) {
    lib.channel.getChannels({}, function(err, result) {
      if (err) {
        logger.error('Error while getting channels', err);
        return res.status(500).json({error: {status: 500}});
      }
      res.status(200).json(result);
    });
  }

  function createChannel(req, res) {

    var channel = {
      name: req.body.name,
      type: 'channel',
      creator: req.user
    };

    lib.channel.createChannel(channel, function(err, result) {
      if (err) {
        logger.error('Error while creating channel', err);
        return res.status(500).json({error: {status: 500}});
      }
      res.status(201).json(result);
    });
  }

  return {
    getMessages: getMessages,
    getChannels: getChannels,
    createChannel: createChannel
  };

};
