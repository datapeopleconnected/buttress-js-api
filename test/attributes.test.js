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

Config.init();

const sleep = (time) => new Promise((r) => setTimeout(r, time));

const users = [{
  app: 'google',
  id: '12345678987654321',
  username: 'User 1',
  token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
  attributes: ['working-date'],
}, {
  app: 'google',
  id: '98765432109876543210',
  username: 'User 2',
  token: 'testisathistestisathistestisathistestisathistestisathis',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
  attributes: ['working-hours'],
}, {
  app: 'google',
  id: '98765432109876543212',
  username: 'User 3',
  token: 'testisathistestisathistestisathistestisathistestisathis',
  email: 'test@test.com',
  profileUrl: 'http://test.com/thisisatest',
  profileImgUrl: 'http://test.com/thisisatest.png',
  attributes: ['working-location'],
}];

const authentication = {
  authLevel: 1,
  domains: ['test.buttress.com'],
  role: 'public',
  permissions: [
    {route: '*', permission: '*'},
  ],
};

const attributes = [{
  name: 'working-date',
  disposition: {
    GET: 'deny',
    PUT: 'deny',
    POST: 'deny',
    DELETE: 'deny',
    SEARCH: 'deny',
  },
  env: {
    'startDate': {
      '@date': '01/01/2022',
    },
    'endDate': {
      '@date': '31/01/2022',
    },
  },
  conditions: {
    '@and': [{
      date: {
        '@date': {
          '@gtDate': '17-01-2022',
        },
      },
    }, {
      date: {
        '@date': {
          '@ltDate': '31-01-2022',
        },
      },
    }],
  },
}, {
  name: 'working-hours',
  targettedSchema: ['task'],
  disposition: {
    GET: 'deny',
    PUT: 'deny',
    POST: 'deny',
    DELETE: 'deny',
    SEARCH: 'deny',
  },
  conditions: {
    '@and': [{
      time: {
        '@time': {
          '@gtDate': '09:00',
        },
      },
    }, {
      time: {
        '@time': {
          '@ltDate': '17:00',
        },
      },
    }],
  },
}, {
  name: 'working-location',
  disposition: {
    GET: 'deny',
    PUT: 'deny',
    POST: 'deny',
    DELETE: 'deny',
    SEARCH: 'deny',
  },
  conditions: {
    '@and': [{
      location: {
        '@location': {
          '@in': ['217.114.52.106'],
        },
      },
    }],
  },
}];

const organisations = [{
  name: 'Company A',
  number: '1',
  status: 'ACTIVE',
}, {
  name: 'Company B',
  number: '2',
  status: 'DISSOLVED',
}, {
  name: 'Company C',
  number: '3',
  status: 'LIQUIDATION',
}];

describe('@app-attributes', function() {
  this.timeout(90000);

  const testUsers = [];
  const testAttributes = [];
  const testCompanies = [];
  let testApp = null;

  const organisationSchema = {
    "name": "organisation",
    "type": "collection",
    "collection": "organisations",
    "properties": {
      "name": {
        "__type": "string",
        "__default": null,
        "__required": true,
        "__allowUpdate": true
      },
      "number": {
        "__type": "string",
        "__default": null,
        "__required": true,
        "__allowUpdate": true
      },
      "status": {
        "__type": "string",
        "__default": null,
        "__required": true,
        "__allowUpdate": true
      }
    }
  }

  before(async function() {
    testApp = await Buttress.App.save({
      name: 'Attribute Test App',
      type: 'server',
      authLevel: 3,
      apiPath: 'attribute-test-app',
    });

    Buttress.setAuthToken(testApp.token);
    Buttress.setAPIPath('attribute-test-app');

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

    await Buttress.setSchema([organisationSchema]);

    await sleep(100);

    await users.reduce(async (prev, user) => {
      await prev;
      const createdUser = await Buttress.Auth.findOrCreateUser(user, authentication);
      testUsers.push(createdUser);
    }, Promise.resolve());

    await organisations.reduce(async (prev, next) => {
      await prev;
      await Buttress.getCollection('organisations').save(next);
    }, Promise.resolve());
  });

  after(async function() {
    Buttress.setAuthToken(Config.token);

    await Buttress.App.remove(testApp.id);

    await testAttributes.reduce(async (prev, next) => {
      await prev;
      await Buttress.Attribute.remove(next.id);
    }, Promise.resolve());

    // await testUsers.reduce(async (prev, next) => {
    //   await prev;
    //   await Buttress.User.remove(next.id);
    // }, Promise.resolve());
  });

  describe('Basic', function() {
    it('should create attributes for users on the app', async function() {
      await attributes.reduce(async (prev, next) => {
        await prev;
        testAttributes.push(await Buttress.Attribute.createAttribute(next));
      }, Promise.resolve());

      testAttributes[0].name.should.equal('working-date');
      testAttributes.length.should.equal(3);
    });
  });
});