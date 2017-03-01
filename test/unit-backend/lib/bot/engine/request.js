'use strict';

const expect = require('chai').expect;

describe('The bot Request', function() {
  it('should instanciate correctly', function() {
    const Request = require('../../../../../backend/lib/bot/engine/request');
    const message = {_id: 1, text: 'Hello'};

    const request = new Request(message);

    expect(request.message).to.not.equal(message);
    expect(request.message).to.deep.equal(message);
  });
});
