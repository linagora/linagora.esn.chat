const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The reindex chat conversation module', function() {
  let getModule;
  let elasticsearch;

  beforeEach(function() {
    elasticsearch = {
      reindexRegistry: {
        register: sinon.spy()
      }
    };

    this.moduleHelpers.addDep('elasticsearch', elasticsearch);
    getModule = () => require('../../../../../backend/lib/search/conversations/reindex')(this.moduleHelpers.dependencies);
  });

  describe('The register function', function() {
    it('should register elasticsearch reindex options for resources', function() {
      mockery.registerMock('../../conversation', () => ({}));
      mockery.registerMock('./listener', () => ({}));
      mockery.registerMock('./denormalize', () => ({}));

      getModule().register();
      expect(elasticsearch.reindexRegistry.register).to.have.been.calledOnce;
      expect(elasticsearch.reindexRegistry.register).to.have.been.calledWith(
        'chat.conversations',
        {
          name: 'chat.conversations.idx',
          buildReindexOptionsFunction: sinon.match.func
        }
      );
    });
  });
});
