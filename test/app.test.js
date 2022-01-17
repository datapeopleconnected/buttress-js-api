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

const sleep = (time) => new Promise((r) => setTimeout(r, time));

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

  const testApp2Schema = [{
    "name": "people",
    "type": "collection",
    "collection": "people",
    "properties": {
      "name": {
        "__type": "string",
        "__default": null,
        "__required": true,
        "__allowUpdate": true
      },
      "carId": {
        "__type": "id",
        "__default": null,
        "__required": true,
        "__allowUpdate": true
      },
    }
  }];

  let testApp2User = null;

  before(async function() {
    testApps.push(await Buttress.App.save({
      name: 'Test App 1',
      type: 'server',
      authLevel: 2,
      apiPath: 'test-app1',
    }));

    Buttress.setAuthToken(testApps[0].token);
    Buttress.setAPIPath('test-app1');

    await Buttress.setSchema([{
      "name": "car",
      "type": "collection",
      "collection": "cars",
      "properties": {
        "name": {
          "__type": "string",
          "__default": null,
          "__required": true,
          "__allowUpdate": true
        },
      }
    }]);

    await sleep(100); // Give it chance for the URL's to be regenerated

    const car = await Buttress.getCollection('cars').save({name: 'A red car'});

    Buttress.setAuthToken(Config.token);

    testApps.push(await Buttress.App.save({
      name: 'Test App 2',
      type: 'server',
      authLevel: 2,
      apiPath: 'test-app2',
    }));

    Buttress.setAuthToken(testApps[1].token);
    Buttress.setAPIPath('test-app2');

    await Buttress.setSchema(testApp2Schema);
    await Buttress.setRoles({
      "default": "public",
      "roles": [
        {
          "name": "public",
          "endpointDisposition": "allowAll",
          "dataDisposition": "allowAll"
        }
      ]
    });

    await sleep(100); // Give it chance for the URL's to be regenerated

    await Buttress.getCollection('people').save({
      name: 'Jeff',
      carId: car.id,
    });

    // Create user
    testApp2User = await Buttress.Auth.findOrCreateUser({
      app: 'app-test2',
      id: '12345678987654321',
      name: 'Joe Bloggs',
      token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
      email: 'test@test.com',
      profileUrl: 'http://test.com/thisisatest',
      profileImgUrl: 'http://test.com/thisisatest.png'
    }, {
      authLevel: Buttress.Token.AuthLevel.USER,
      permissions: [{
        route: "*",
        permission: "*"
      }],
      role: 'public',
      domains: ['test.local.buttressjs.com']
    });
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);

    await Buttress.App.remove(testApps[0].id);
    await Buttress.App.remove(testApps[1].id);
  });

  describe('Basic', function() {
    it('should create a destination relationship', async function() {
      Buttress.setAuthToken(Config.token);

      const res = await Buttress.App.registerDataSharing({
        name: 'test-app1',
        localAppId: testApps[0].id,

        remoteApp: {
          endpoint: Config.endpoint,
          apiPath: testApps[1].apiPath,
          token: 'OAKSDOKASOD',
        },

        dataSharing: {
          localApp: "",
          remoteApp: {
            cars: [
              "READ"
            ]
          }
        }
      });

      res.type.should.equal('destination');
      res.source.appId.should.equal(testApps[0].id);
      res.source.endpoint.should.equal(Config.endpoint);
      res.destination.appId.should.equal(testApps[1].id);
      res.destination.endpoint.should.equal(Config.endpoint);
      res.destination.sourceToken.should.not.equal(null);
      testAppRelationships.push(res);
    });

    it('should create a source relationship', async function() {
      Buttress.setAuthToken(Config.token);

      const res = await Buttress.App.addRelationship({
        name: 'tap1-tap2',
        type: 'source',
        source: {
          appId: testApps[0].id,
          endpoint: Config.endpoint,
          apiPath: testApps[0].apiPath,
          policy: '{}',
        },
        destination: {
          appId: testApps[1].id,
          endpoint: Config.endpoint,
          apiPath: testApps[1].apiPath,
          sourceToken: null,
        }
      });

      res.type.should.equal('source');
      res.source.appId.should.equal(testApps[0].id);
      res.source.endpoint.should.equal(Config.endpoint);
      res.destination.appId.should.equal(testApps[1].id);
      res.destination.endpoint.should.equal(Config.endpoint);
      res.destination.sourceToken.should.not.equal(null);
      testAppRelationships.push(res);
    });

    it('should update the policy for the source relationship', async function() {
      Buttress.setAuthToken(testApps[0].token);

      const res = await Buttress.App.updateRelationshipPolicy(testAppRelationships[0].id, {
        "collections": [
          "cars"
        ]
      });
      
      res.should.equal(true);

      Buttress.setAuthToken(testApps[1].token);
      Buttress.setAPIPath('test-app2');

      testApp2Schema.push({
        "name": "car",
        "type": "collection",
        "collection": "cars",
        "remote": "tap1-tap2.cars",
      });

      await Buttress.setSchema(testApp2Schema);
    });

    it('should be able access data from App 1 using a App 2 token', async function() {
      const [{value}] = testApp2User.tokens;

      Buttress.setAuthToken(value);
      Buttress.setAPIPath('test-app2');

      const people = await Buttress.getCollection('people').getAll();

      people.length.should.equal(1, 'Person count doesn\'t match whats expected');
      people[0].name.should.equal('Jeff');

      const cars = await Buttress.getCollection('cars').getAll();

      cars.length.should.equal(1, 'Car count doesn\'t match whats expected');
      cars[0].id.should.equal(people[0].carId);
    });
  });
});
