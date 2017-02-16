"use strict";

/**
 * Rhizome API -
 *
 * @file config.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Rhizome = require('../lib/rhizome');

class Config {
  constructor() {
    this._initialised = false;
  }

  init() {
    if (this._initialised === true) {
      return;
    }
    this._initialised = true;

    Rhizome.init({
      rhizomeUrl: process.env.RHIZOME_TEST_API_URL,
      appToken: process.env.RHIZOME_TEST_SUPER_APP_KEY
    });

    before(function(done) {
      Promise.all([
        Rhizome.Campaign.removeAll(),
        Rhizome.User.removeAll(),
        Rhizome.Person.removeAll(),
        Rhizome.Token.removeAllUserTokens(),
        Rhizome.Organisation.removeAll(),
        Rhizome.Company.removeAll(),
        Rhizome.Contactlist.removeAll(),
        Rhizome.Call.removeAll(),
        Rhizome.Task.removeAll(),
        Rhizome.Notification.removeAll(),
        Rhizome.Appointment.removeAll()
      ]).then(() => done());
    });

    after(function(done) {
      done();
    });
  }

  createCompanies() {
    const companies = [
      {
        name: 'Company 1',
        location: {
          name: 'HQ',
          address: '123 Acacia Avenue, Brixton',
          city: 'London',
          postCode: 'SW9 4DW',
          phoneNumber: '0205 123123'
        },
        contact: {
          name: 'Bananaman',
          role: 'Superhero',
          email: 'bananas@man.com',
          mobile: '07777 777777'

        }
      },
      {
        name: 'Company 2',
        location: {
          name: 'HQ',
          address: '123 Acacia Avenue, Brixton',
          city: 'London',
          postCode: 'SW9 4DW',
          phoneNumber: '0205 123123'
        },
        contact: {
          name: 'Bananaman',
          role: 'Superhero',
          email: 'bananas@man.com',
          mobile: '07777 777777'
        }
      },
      {
        name: 'Company 3',
        location: {
          name: 'HQ',
          address: '123 Acacia Avenue, Brixton',
          city: 'London',
          postCode: 'SW9 4DW',
          phoneNumber: '0205 123123'
        },
        contact: {
          name: 'Bananaman',
          role: 'Superhero',
          email: 'bananas@man.com',
          mobile: '07777 777777'
        }
      },
      {
        name: 'Company 4',
        location: {
          name: 'HQ',
          address: '123 Acacia Avenue, Brixton',
          city: 'London',
          postCode: 'SW9 4DW',
          phoneNumber: '0205 123123'
        },
        contact: {
          name: 'Bananaman',
          role: 'Superhero',
          email: 'bananas@man.com',
          mobile: '07777 777777'
        }
      },
      {
        name: 'Company 5',
        location: {
          name: 'HQ',
          address: '123 Acacia Avenue, Brixton',
          city: 'London',
          postCode: 'SW9 4DW',
          phoneNumber: '0205 123123'
        },
        contact: {
          name: 'Bananaman',
          role: 'Superhero',
          email: 'bananas@man.com',
          mobile: '07777 777777'
        }
      }
    ];
    return Rhizome.Company.saveAll({companies: companies})
      .then(companyIds => {
        return Rhizome.Company.bulkLoad(companyIds);
      })
      .catch(err => {
        throw err;
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
    return Rhizome.Auth.findOrCreateUser(userAppAuth)
      .catch(err => {
        throw err;
      });
  }

}

module.exports = new Config();
