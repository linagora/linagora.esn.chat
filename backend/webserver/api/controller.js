'use strict';

module.exports = function(dependencies, lib) {

  var logger = dependencies('logger');

  function getMessages(req, res) {
    lib.channel.getMessages(req.params.channel, {}, function(err, results) {
      if (err) {
        logger.error('Error while getting messages', err);
        return res.status(500).json({error: {status: 500}});
      }

      results = results.map(function(message) {
        delete message.password;
        return message;
      });

      return res.status(200).json(results);
    });
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

  function getChannel(req, res) {
    lib.channel.getChannel(req.params.id, function(err, result) {
      if (err) {
        logger.error('Error while getting the channel', err);
        return res.status(500).json({error: {status: 500}});
      }
      res.status(200).json(result);
    });
  }

  function deleteChannel(req, res) {
    lib.channel.deleteChannel(req.params.id, function(err, result) {
      if (err) {
        logger.error('Error while deleting the channel', err);
        return res.status(500).json({error: {status: 500}});
      }
      res.status(200).json(result);
    });
  }

  function createChannel(req, res) {

    var channel = {
      name: req.body.name,
      type: 'channel',
      creator: req.user,
      topic: {
        value: req.body.topic,
        creator: req.user
      },
      purpose: {
        value: req.body.purpose,
        creator: req.user
      }
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
    getChannel: getChannel,
    deleteChannel: deleteChannel,
    createChannel: createChannel
  };

};
