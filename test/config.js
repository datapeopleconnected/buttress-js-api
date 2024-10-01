"use strict";

/**
 * Buttress API - The federated real-time open data platform
 * Copyright (C) 2016-2024 Data People Connected LTD.
 * <https://www.dpc-ltd.com/>
 *
 * This file is part of Buttress.
 * Buttress is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public Licence as published by the Free Software
 * Foundation, either version 3 of the Licence, or (at your option) any later version.
 * Buttress is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public Licence for more details.
 * You should have received a copy of the GNU Affero General Public Licence along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

require('source-map-support').install();

const {default: Buttress} = require('../dist/index');
const TestSchema = require('./data/schema');
const TestPolicies = require('./data/policy/index.js');
const ObjectId = require('bson-objectid');

// TODO: Update AppRoles to Policy.

const PolicyPropertiesList = Object.values(TestPolicies).reduce((list, policy) => {
  if (policy.selection) {
    Object.keys(policy.selection).forEach((key) => {
      if (!list[key]) list[key] = [];
      if (typeof policy.selection[key] === 'object') {
        list[key].push(...Object.values(policy.selection[key]));
      } else {
        list[key].push(policy.selection[key]);
      }
    });
  }
  return list;
}, {});

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

    this.token_super = process.env.BUTTRESS_TEST_SUPER_APP_KEY;
  }

  /**
   */
  init() {
    if (this._initialised === true) {
      return;
    }
    this._initialised = true;

    console.log(`BUTTRESS_TEST_API_URL: `, this.endpoint);
    console.log(`BUTTRESS_TEST_SUPER_APP_KEY: `, this.token_super);

    before(async () => {
      await Buttress.init({
        buttressUrl: this.endpoint,
        appToken: this.token_super,
        allowUnauthorized: true,
        apiPath: 'bjs',
        version: 1,
        update: true,
      });

      await Promise.all([
        // Remove all existing apps, this should clear out any existing data.
        await Buttress.getCollection('app').removeAll(),
        // Buttress.getCollection('service').removeAll(),
        // Buttress.getCollection('company').removeAll(),
        // Buttress.getCollection('board').removeAll(),
        // Buttress.getCollection('post').removeAll(),
      ]);
      console.log('Cleared out existing local data.');

      // Create a test app
      const testApp = await Buttress.getCollection('app').save({
        name: 'Test App',
        apiPath: 'test',
        policyPropertiesList: PolicyPropertiesList
      });

      this.token = testApp.token;

      Buttress.setAuthToken(testApp.token);
      Buttress.setAPIPath(testApp.apiPath);

      Buttress.getCollection('app').updateSchema(TestSchema);

      // Add the policies
      const TestData = Object.values(TestPolicies);
      for await (const policy of TestData) {
        await Buttress.getCollection('policy').createPolicy(policy);
        console.log(`Added policy: ${policy.name}`);
      }
    });

    after(function(done) {
      done();
    });
  }

  configureSuper() {
    Buttress.setAuthToken(this.token_super);
    Buttress.setAPIPath('bjs');
  }
  configureTest() {
    Buttress.setAuthToken(this.token);
    Buttress.setAPIPath('test');
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

    return Buttress.getCollection('company').bulkSave(companies);
  }

  createUser() {
    return Buttress.Auth.findOrCreateUser({
      app: 'google',
      appId: '12345678987654321',
      name: 'Chris Bates-Keegan',
      token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
      email: 'test@test.com',
      profileUrl: 'http://test.com/thisisatest',
      profileImgUrl: 'http://test.com/thisisatest.png'
    }, {
      domains: [Buttress.options.url.host],
      policyProperties: {}
    });
  }

}

module.exports = new Config();
