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

import 'source-map-support/register';

import Buttress from '../dist/index';
import TestSchema from './data/schema';
import TestPolicies from './data/policy';
import ObjectId from 'bson-objectid';
import type App from '../dist/app';

// TODO: Update AppRoles to Policy.

const PolicyPropertiesList = Object.values(TestPolicies).reduce<Record<string, unknown[]>>((list, policy) => {
  const selection: Record<string, unknown> = policy.selection;
  if (selection) {
    Object.keys(selection).forEach((key) => {
      if (!list[key]) list[key] = [];
      const value = selection[key];
      if (typeof value === 'object' && value !== null) {
        list[key].push(...Object.values(value));
      } else {
        list[key].push(value);
      }
    });
  }
  return list;
}, {});

/**
 * @class Config
 */
class Config {
  _initialised: boolean;
  endpoint: string;
  remoteEndpoint: string;
  // Set once the test app has been created.
  token!: string;
  token_super: string;

  /**
   * Creates an instance of Config.
   */
  constructor() {
    this._initialised = false;

    this.endpoint = process.env.BUTTRESS_TEST_API_URL as string;
    // The address Buttress reaches itself on, for data shares. Inside Docker that isn't the port the tests use.
    this.remoteEndpoint = process.env.BUTTRESS_TEST_REMOTE_API_URL || this.endpoint;

    this.token_super = process.env.BUTTRESS_TEST_SUPER_APP_KEY as string;
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
        await Buttress.getCollection<App>('app').removeAll(),
        // Buttress.getCollection('service').removeAll(),
        // Buttress.getCollection('company').removeAll(),
        // Buttress.getCollection('board').removeAll(),
        // Buttress.getCollection('post').removeAll(),
      ]);
      console.log('Cleared out existing local data.');

      // Create a test app
      const testApp = await Buttress.getCollection<App>('app').save({
        name: 'Test App',
        apiPath: 'test',
        policyPropertiesList: PolicyPropertiesList,
      });

      this.token = testApp.token;

      Buttress.setAuthToken(testApp.token);
      Buttress.setAPIPath(testApp.apiPath);

      await Buttress.getCollection<App>('app').updateSchema(TestSchema);

      // Add the policies
      const TestData = Object.values(TestPolicies);
      for await (const policy of TestData) {
        await Buttress.Policy.createPolicy(policy);
        console.log(`Added policy: ${policy.name}`);
      }
    });

    after(function (done) {
      done();
    });
  }

  /**
   * Runs a request until it gets past "No route takes", for the first request after a schema is saved. Buttress has
   * several workers, each of which builds an app's routes a moment after the schema is saved, so a request can reach one
   * that doesn't have them yet. Any other failure is the test's to see.
   * @param {function(): Promise} request
   * @param {Object} [options]
   * @param {number} [options.attempts]
   * @param {number} [options.delayMs]
   * @return {Promise}
   */
  async retryUnrouted<T>(request: () => Promise<T>, {attempts = 50, delayMs = 100} = {}): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await request();
      } catch (err: any) {
        const unrouted = err.statusCode === 404 && /^No route takes /.test(err.message);
        if (!unrouted || attempt >= attempts) throw err;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
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
        locations: [
          {
            id: new ObjectId().toHexString(),
            name: 'HQ',
            address: '123 Acacia Avenue, Brixton',
            city: 'London',
            postCode: 'SW9 4DW',
            phoneNumber: '0205 123123',
          },
        ],
        contacts: [
          {
            id: new ObjectId().toHexString(),
            name: 'Bananaman',
            role: 'Superhero',
            email: 'bananas@man.com',
            mobile: '07777 777777',
          },
        ],
      },
      {
        name: 'Company 2',
        companyType: 'prospect',
        locations: [
          {
            id: new ObjectId().toHexString(),
            name: 'HQ',
            address: '123 Acacia Avenue, Brixton',
            city: 'London',
            postCode: 'SW9 4DW',
            phoneNumber: '0205 123123',
          },
        ],
        contacts: [
          {
            id: new ObjectId().toHexString(),
            name: 'Bananaman',
            role: 'Superhero',
            email: 'bananas@man.com',
            mobile: '07777 777777',
          },
        ],
      },
      {
        name: 'Company 3',
        companyType: 'prospect',
        locations: [
          {
            id: new ObjectId().toHexString(),
            name: 'HQ',
            address: '123 Acacia Avenue, Brixton',
            city: 'London',
            postCode: 'SW9 4DW',
            phoneNumber: '0205 123123',
          },
        ],
        contacts: [
          {
            id: new ObjectId().toHexString(),
            name: 'Bananaman',
            role: 'Superhero',
            email: 'bananas@man.com',
            mobile: '07777 777777',
          },
        ],
      },
      {
        name: 'Company 4',
        companyType: 'prospect',
        locations: [
          {
            id: new ObjectId().toHexString(),
            name: 'HQ',
            address: '123 Acacia Avenue, Brixton',
            city: 'London',
            postCode: 'SW9 4DW',
            phoneNumber: '0205 123123',
          },
        ],
        contacts: [
          {
            id: new ObjectId().toHexString(),
            name: 'Bananaman',
            role: 'Superhero',
            email: 'bananas@man.com',
            mobile: '07777 777777',
          },
        ],
      },
      {
        name: 'Company 5',
        companyType: 'prospect',
        locations: [
          {
            id: new ObjectId().toHexString(),
            name: 'HQ',
            address: '123 Acacia Avenue, Brixton',
            city: 'London',
            postCode: 'SW9 4DW',
            phoneNumber: '0205 123123',
          },
        ],
        contacts: [
          {
            id: new ObjectId().toHexString(),
            name: 'Bananaman',
            role: 'Superhero',
            email: 'bananas@man.com',
            mobile: '07777 777777',
          },
        ],
      },
    ];

    return Buttress.getCollection('company').bulkSave(companies);
  }

  createUser() {
    return Buttress.Auth.findOrCreateUser(
      {
        app: 'google',
        appId: '12345678987654321',
        name: 'Chris Bates-Keegan',
        token: 'thisisatestthisisatestthisisatestthisisatestthisisatest',
        email: 'test@test.com',
        profileUrl: 'http://test.com/thisisatest',
        profileImgUrl: 'http://test.com/thisisatest.png',
      },
      {
        domains: [this.endpoint],
        policyProperties: {},
      },
    );
  }
}

export default new Config();
