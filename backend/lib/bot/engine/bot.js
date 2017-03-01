'use strict';

const EventEmitter = require('events').EventEmitter;
const Listener = require('./listener');
const Request = require('./request');
const Response = require('./response');

class Bot extends EventEmitter {
  constructor(adapter, name = 'ChatBot') {
    super();
    this.adapter = adapter;
    this.listeners = [];
    this.name = name;
  }

  listen(matchHandler, responseHandler) {
    if (!matchHandler || !responseHandler) {
      throw new Error('matchHandler and responseHandler are required');
    }

    this.listeners.push(new Listener(this, matchHandler, responseHandler));
  }

  processListeners(message) {
    const promises = this.listeners.map(listener => {
      const request = new Request(message);

      return listener.matchHandler(request)
        .then(match => {
          if (Array.isArray(match) && match.length === 0) {
            match = false;
          }
          request.match = match;

          return {request, listener};
        })
        .catch(err => {
          request.err = err;
          request.match = false;

          return Promise.resolve({request});
        });
    });

    return Promise.all(promises)
      .then(results => results.filter(result => !!result.request.match))
      .then(matchingResults => matchingResults.forEach(matching => {
        try {
          matching.listener.handler(new Response(this, matching.request));
        } catch (err) {
          this.adapter.logger.warn('Error occured on responseMatcher', err);
        }
      }));
  }

  reply(context, message) {
    this.adapter.reply(context, message);
  }

  send(context, message) {
    this.adapter.send(context, message);
  }

  start() {
    this.adapter.on('message', this.processListeners.bind(this));
  }
}

module.exports = Bot;
