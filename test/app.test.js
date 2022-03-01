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
const Schemas = require('./data/schema');

Config.init();

const sleep = (time) => new Promise((r) => setTimeout(r, time));

describe('@app-schema', function() {
  this.timeout(2000);

  before(function(done) {
    done();
  });

  after(function(done) {
    // Buttress.options.schema = Schemas;
    // Buttress.initSchema()
    //   .then(() => done())
    //   .catch(function(err) {
    //     done(err);
    //   });
    done();
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
    Buttress.setAPIPath('bjs');

    await Buttress.App.remove(testApps[0].id);
    await Buttress.App.remove(testApps[1].id);
  });

  describe('Basic', function() {
    it('should register a data share for app2 to connect to app1', async function() {
      Buttress.setAuthToken(Config.token);

      const res = await Buttress.App.registerDataSharing({
        name: 'test-app2',

        remoteApp: {
          endpoint: Config.endpoint,
          apiPath: testApps[1].apiPath,
          token: null,
        },

        dataSharing: {
          localApp: "",
          remoteApp: JSON.stringify({
            cars: [
              "READ"
            ]
          }),
        },

        _appId: testApps[0].id,
      });

      res.name.should.equal('test-app2');
      res.remoteApp.endpoint.should.equal(Config.endpoint);
      res.remoteApp.apiPath.should.equal(testApps[1].apiPath);
      testAppRelationships.push(res);
    });

    it('should register a data share for app1 to connect to app2', async function() {
      Buttress.setAuthToken(Config.token);

      const res = await Buttress.App.registerDataSharing({
        name: 'test-app1',

        remoteApp: {
          endpoint: Config.endpoint,
          apiPath: testApps[0].apiPath,
          token: testAppRelationships[0].remoteAppToken,
        },

        dataSharing: {
          localApp: JSON.stringify({
            cars: [
              "READ"
            ]
          }),
          remoteApp: null,
        },

        _appId: testApps[1].id,
      });

      res.name.should.equal('test-app1');
      res.active.should.equal(true);
      res.remoteApp.endpoint.should.equal(Config.endpoint);
      res.remoteApp.apiPath.should.equal(testApps[0].apiPath);
      res.remoteApp.token.should.equal(testAppRelationships[0].remoteAppToken);
      testAppRelationships.push(res);
    });

    // TODO: Add test to fetch app relationships
    // it('should have active data sharing agreements', () => {

    // });

    it('should update the policy for the source relationship', async function() {
      Buttress.setAuthToken(testApps[0].token);

      const res = await Buttress.App.updateDataSharingPolicy(testAppRelationships[0].id, {
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
        "remote": "test-app1.cars",
        "properties": {
          "price": {
            "__type": "string",
            "__required": true,
            "__allowUpdate": true,
          },
        }
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

    it('should be able to add a new car and see activity on both apps', async function() {
      Buttress.setAuthToken(testApps[0].token);
      Buttress.setAPIPath('test-app1');

      // await sleep(1000);

      await Buttress.getCollection('cars').save({name: 'A red car'});
    });
  });
});
