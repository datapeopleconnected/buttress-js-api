"use strict";

/**
 * Buttress API -
 *
 * @file app.test.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const Config = require('./config');
const TestSchema = require('./data/schema');
const Schemas = require('./data/schema');

Config.init();

describe('@app-schema', function() {
  this.timeout(2000);

  before(function(done) {
    done();
  });

  after(function(done) {
    Buttress.options.schema = TestSchema;
    Buttress.initSchema()
      .then(() => done())
      .catch(function(err) {
        done(err);
      });
  });

  describe('Basic', function() {
    it('should return the app schema', function(done) {
      Buttress.App
        .getSchema()
        .then(function(schema) {
          schema.length.should.equal(Schemas.length);
          schema[3].collection.should.equal('services');
          schema[3].name.should.equal('service');
          schema[3].properties.appProp1.__type.should.equal('string');
          schema[3].properties.appProp1.__required.should.equal(true);
          schema[3].properties.appProp1.__allowUpdate.should.equal(true);
          schema[3].properties.appProp5.__default.should.equal('pending');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it(`should fail when trying to interact with 'test' schema`, function(done) {
      try {
        Buttress.getCollection('tests');
      } catch (err) {
        if (err instanceof Buttress.Errors.SchemaNotFound) {
          return done();
        }
        done(err);
      }
    });

    it(`should update the app schema with 'test'`, function(done) {
      Buttress.options.schema = [{
        "name": "test",
        "type": "collection",
        "collection": "tests",
        "properties": {
          "name": {
            "__type": "string",
            "__default": null,
            "__required": true,
            "__allowUpdate": true
          }
        }
      }];

      Buttress.initSchema()
        .then(() => {
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it(`should be able to interact with 'test' schema`, function(done) {
      try {
        Buttress.getCollection('tests');
      } catch (err) {
        return done(err);
      }

      Buttress.getCollection('tests')
        .getAll()
        .then((tests) => {
          tests.length.should.equal(0);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});

describe('@app-relationship', function() {
  this.timeout(90000);
  const testApps = [];

  const testAppRelationships = [];

  before(async function() {
    testApps.push(await Buttress.App.save({
      name: 'Test App 1',
      type: 'server',
      authLevel: 2
    }));
    testApps.push(await Buttress.App.save({
      name: 'Test App 2',
      type: 'server',
      authLevel: 2
    }));
  });

  after(async function() {
    Buttress.App.remove(testApps[0].id);
    Buttress.App.remove(testApps[1].id);
  });

  describe('Basic', function() {
    it('should create a source relationship', function(done) {
      Buttress.App
        .addAppRelationship({
          type: 'source',
          source: {
            appId: testApps[0].id,
            endpoint: Config.endpoint,
            policy: '{}',
          },
          destination: {
            appId: testApps[1].id,
            endpoint: Config.endpoint,
            sourceToken: null,
          }
        })
        .then(function(res) {
          res.type.should.equal('source');
          res.source.appId.should.equal(testApps[0].id);
          res.source.endpoint.should.equal(Config.endpoint);
          res.destination.appId.should.equal(testApps[1].id);
          res.destination.endpoint.should.equal(Config.endpoint);
          res.destination.sourceToken.should.not.equal(null);
          testAppRelationships.push(res);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should create a destination relationship', function(done) {
      Buttress.App
        .addAppRelationship({
          type: 'destination',
          source: {
            appId: testApps[0].id,
            endpoint: Config.endpoint,
            policy: '{}',
          },
          destination: {
            appId: testApps[1].id,
            endpoint: Config.endpoint,
            sourceToken: testAppRelationships[0].destination.sourceToken,
          }
        })
        .then(function(res) {
          res.type.should.equal('destination');
          res.source.appId.should.equal(testApps[0].id);
          res.source.endpoint.should.equal(Config.endpoint);
          res.destination.appId.should.equal(testApps[1].id);
          res.destination.endpoint.should.equal(Config.endpoint);
          res.destination.sourceToken.should.not.equal(null);
          testAppRelationships.push(res);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should update the policy for the source relationship', function(done) {
      
    });
  });
});
