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
      this.timeout(6000);
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
        Rhizome.Notification.removeAll()
      ]).then(() => done());
    });

    after(function(done) {
      done();
    });
  }
}

module.exports = new Config();
