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
const TestSchema = require('./data/schema.json');
const TestUserRoles = require('./data/userRoles.json');
const ObjectId = require('mongodb').ObjectId;

class Config {
  constructor() {
    this._initialised = false;
  }

  init() {
    if (this._initialised === true) {
      return;
    }
    this._initialised = true;

    Buttress.init({
      buttressUrl: process.env.BUTTRESS_TEST_API_URL,
      appToken: process.env.BUTTRESS_TEST_SUPER_APP_KEY,
      schema: TestSchema,
      userRoles: TestUserRoles
    });

    before(function(done) {
      Promise.all([
        Buttress.initSchema(),
        Buttress.User.removeAll(),
        Buttress.Person.removeAll(),
        Buttress.Token.removeAllUserTokens(),
        Buttress.Service.removeAll(),
        Buttress.Company.removeAll()
      ])
        .then(() => done())
        .catch(err => {
          if (err.statusCode) {
            console.log(`${err.statusCode}: ${err.statusMessage}`);
            return;
          }
          console.log(err);
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
    return Buttress.Company.saveAll(companies)
      .then(companyIds => {
        return Buttress.Company.bulkLoad(companyIds);
      })
      .catch(err => {
        console.log(err);
      });
  }

  createUser() {
    let userAppAuth = {
      app: 'google',
      id: '12345678987654321',
      name: 'Chris Bates-Keegan',
      token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
      email: 'test@test.com',
      profileUrl: 'http://test.com/thisisatest',
      profileImgUrl: 'http://test.com/thisisatest.png'
    };
    return Buttress.Auth.findOrCreateUser(userAppAuth)
      .catch(err => {
        console.log(err);
      });
  }

}

module.exports = new Config();
