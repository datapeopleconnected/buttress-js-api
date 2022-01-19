"use strict";

/**
 * Buttress API -
 *
 * @file config.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('../lib/buttressjs');
const TestSchema = require('./data/schema');
const TestAppRoles = require('./data/appRoles.json');
const ObjectId = require('mongodb').ObjectId;

/**
 * @class Config
 */
class Config {
  /**
   * Creates an instance of Config.
   */
  constructor() {
    this._initialised = false;

    this.endpoint = process.env.BUTTRESS_TEST_API_URL;
    this.token = process.env.BUTTRESS_TEST_SUPER_APP_KEY;
  }

  /**
   */
  init() {
    if (this._initialised === true) {
      return;
    }
    this._initialised = true;

    console.log(`BUTTRESS_TEST_API_URL: `, this.endpoint);
    console.log(`BUTTRESS_TEST_SUPER_APP_KEY: `, this.token);

    before((done) => {
      Buttress.init({
        buttressUrl: this.endpoint,
        appToken: this.token,
        allowUnauthorized: true,
        schema: TestSchema,
        roles: TestAppRoles,
        apiPath: 'bjs',
        version: 1,
        update: true,
      })
        .then(() => {
          return Promise.all([
            Buttress.User.removeAll(),
            Buttress.Token.removeAllUserTokens(),
            Buttress.getCollection('services').removeAll(),
            Buttress.getCollection('companies').removeAll(),
            Buttress.getCollection('boards').removeAll(),
            Buttress.getCollection('posts').removeAll(),
          ]);
        })
        .then(() => done())
        .catch((err) => {
          if (err.statusCode) {
            console.error(`${err.statusCode}: ${err.statusMessage}`);
            return;
          }
          console.error(err);
        });
    });

    after(function(done) {
      done();
    });
  }

  createCompanies() {
    const companies = [
      {
        name: 'Company 1',
        companyType: 'prospect',
        locations: [{
          id: (new ObjectId()).toHexString(),
          name: 'HQ',
          address: '123 Acacia Avenue, Brixton',
          city: 'London',
          postCode: 'SW9 4DW',
          phoneNumber: '0205 123123'
        }],
        contacts: [{
          id: (new ObjectId()).toHexString(),
          name: 'Bananaman',
          role: 'Superhero',
          email: 'bananas@man.com',
          mobile: '07777 777777'

        }]
      },
      {
        name: 'Company 2',
        companyType: 'prospect',
        locations: [{
          id: (new ObjectId()).toHexString(),
          name: 'HQ',
          address: '123 Acacia Avenue, Brixton',
          city: 'London',
          postCode: 'SW9 4DW',
          phoneNumber: '0205 123123'
        }],
        contacts: [{
          id: (new ObjectId()).toHexString(),
          name: 'Bananaman',
          role: 'Superhero',
          email: 'bananas@man.com',
          mobile: '07777 777777'
        }]
      },
      {
        name: 'Company 3',
        companyType: 'prospect',
        locations: [{
          id: (new ObjectId()).toHexString(),
          name: 'HQ',
          address: '123 Acacia Avenue, Brixton',
          city: 'London',
          postCode: 'SW9 4DW',
          phoneNumber: '0205 123123'
        }],
        contacts: [{
          id: (new ObjectId()).toHexString(),
          name: 'Bananaman',
          role: 'Superhero',
          email: 'bananas@man.com',
          mobile: '07777 777777'
        }]
      },
      {
        name: 'Company 4',
        companyType: 'prospect',
        locations: [{
          id: (new ObjectId()).toHexString(),
          name: 'HQ',
          address: '123 Acacia Avenue, Brixton',
          city: 'London',
          postCode: 'SW9 4DW',
          phoneNumber: '0205 123123'
        }],
        contacts: [{
          id: (new ObjectId()).toHexString(),
          name: 'Bananaman',
          role: 'Superhero',
          email: 'bananas@man.com',
          mobile: '07777 777777'
        }]
      },
      {
        name: 'Company 5',
        companyType: 'prospect',
        locations: [{
          id: (new ObjectId()).toHexString(),
          name: 'HQ',
          address: '123 Acacia Avenue, Brixton',
          city: 'London',
          postCode: 'SW9 4DW',
          phoneNumber: '0205 123123'
        }],
        contacts: [{
          id: (new ObjectId()).toHexString(),
          name: 'Bananaman',
          role: 'Superhero',
          email: 'bananas@man.com',
          mobile: '07777 777777'
        }]
      }
    ];

    return Buttress.getCollection('companies').bulkSave(companies);
  }

  createUser() {
    return Buttress.Auth.findOrCreateUser({
      app: 'google',
      id: '12345678987654321',
      name: 'Chris Bates-Keegan',
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
      domains: [Buttress.options.url.host]
    })
      .catch(err => {
        console.log(err);
      });
  }

}

module.exports = new Config();
