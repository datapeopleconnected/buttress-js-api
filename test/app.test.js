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

describe('@app', function() {
  this.timeout(2000);
  const testApps = [];

  before(async function() {
    Buttress.setAuthToken(Config.token);
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);
    for await (const testApp of testApps) {
      await Buttress.App.remove(testApp.id);
    }
  });

  describe('Basic', function() {
    it('should create an app', async function() {
      const testAppData = {
        name: 'Test App',
        type: 'server',
        version: '1.0.0',
        authLevel: 2,
        apiPath: 'test-app',
      };

      const testApp = await Buttress.App.save(testAppData);

      testApp.name.should.equal(testAppData.name);
      testApp.version.should.equal(testAppData.version);
      testApp.apiPath.should.equal(testAppData.apiPath);

      testApps.push(testApp);
    });
  });

});

describe('@app-schema', function() {
  this.timeout(2000);
  const testApps = [];

  before(function(done) {
    done();
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);
    // Buttress.options.schema = Schemas;
    // Buttress.initSchema()
    //   .then(() => done())
    //   .catch(function(err) {
    //     done(err);
    //   });
    for await (const testApp of testApps) {
      await Buttress.App.remove(testApp.id);
    }
  });

  describe('Basic', function() {
    it('should return the app schema', function(done) {
      Buttress.App
        .getSchema()
        .then(function(schema) {
          schema.length.should.equal(Schemas.length);
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
        Buttress.getCollection('test');
      } catch (err) {
        return done(err);
      }

      Buttress.getCollection('test')
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

  // describe('Datastore', function() {
  //   it('should create an app with an external datastore', async function() {
  //     Buttress.setAuthToken(Config.token);

  //     const testData = {
  //       name: 'Test App Datastore',
  //       type: 'server',
  //       authLevel: 2,
  //       apiPath: 'test-other-datastore',
  //       datastore: {
  //         connectionString: 'mysql://root:langdale@127.0.0.1'
  //       }
  //     };

  //     const res = await Buttress.App.save(testData);

  //     res.name.should.equal(testData.name);
  //     res.apiPath.should.equal(testData.apiPath);
  //     res.datastore.connectionString.should.equal(testData.datastore.connectionString);

  //     testApps.push(res);
  //   });

  //   it('should update the schema for the external datastore app', async function() {
  //     const testApp = testApps[testApps.length - 1];
  //     Buttress.setAuthToken(testApp.token);
  //     Buttress.setAPIPath(testApp.apiPath);

  //     await Buttress.setSchema([{
  //       "name": "car",
  //       "type": "collection",
  //       "properties": {
  //         "name": {
  //           "__type": "string",
  //           "__default": null,
  //           "__required": true,
  //           "__allowUpdate": true
  //         },
  //       }
  //     }]);
  //   });

  //   it('should add a two items to the external datastore app', async function() {
  //     const testApp = testApps[testApps.length - 1];
  //     Buttress.setAuthToken(testApp.token);
  //     Buttress.setAPIPath(testApp.apiPath);

  //     // Wait a little
  //     await sleep(500);

  //     const testData = {name: 'A red car'};

  //     const res = await Buttress.getCollection('car').save(testData);

  //     await Buttress.getCollection('car').save({name: 'A blue car'});

  //     res.name.should.equal(testData.name);
  //   });

  //   it('should get items from the  external datastore app', async function() {
  //     const testApp = testApps[testApps.length - 1];
  //     Buttress.setAuthToken(testApp.token);
  //     Buttress.setAPIPath(testApp.apiPath);

  //     const res = await Buttress.getCollection('car').getAll();

  //     res.length.should.equal(2);
  //   });
  // });
});

describe('@app-relationship', function() {
  this.timeout(90000);
  const testApps = [];

  const testAppRelationships = [];

  const testApp2Schema = [{
    "name": "people",
    "type": "collection",
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
    Buttress.setAuthToken(Config.token);

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

    const car = await Buttress.getCollection('car').save({name: 'A red car'});

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
      profileImgUrl: 'http://test.com/thisisatest.png',
      policyProperties: {
        role: 'public',
      },
    }, {
      authLevel: Buttress.Token.AuthLevel.USER,
      permissions: [{
        route: "*",
        permission: "*"
      }],
      domains: ['test.local.buttressjs.com']
    });
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);
    Buttress.setAPIPath('bjs');

    for await (const testApp of testApps) {
      await Buttress.App.remove(testApp.id);
    }
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
            car: [
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
            car: [
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
          "car"
        ]
      });
      
      res.should.equal(true);

      Buttress.setAuthToken(testApps[1].token);
      Buttress.setAPIPath('test-app2');

      testApp2Schema.push({
        "name": "car",
        "type": "collection",
        "remote": "test-app1.car",
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
      const value = testApp2User.token;

      Buttress.setAuthToken(value);
      Buttress.setAPIPath('test-app2');

      const people = await Buttress.getCollection('people').getAll();

      people.length.should.equal(1, 'Person count doesn\'t match whats expected');
      people[0].name.should.equal('Jeff');

      const cars = await Buttress.getCollection('car').getAll();

      cars.length.should.equal(1, 'Car count doesn\'t match whats expected');
      cars[0].id.should.equal(people[0].carId);
    });

    it('should be able to add a new car and see activity on both apps', async function() {
      Buttress.setAuthToken(testApps[0].token);
      Buttress.setAPIPath('test-app1');

      // await sleep(1000);

      await Buttress.getCollection('car').save({name: 'A red car'});
    });
  });
});
