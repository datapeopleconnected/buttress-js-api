'use strict';

/**
 * Rhizome API -
 *
 * @file rhizome.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const AppMetadata = require('./app-metadata');
const UserMetadata = require('./user-metadata');
const User = require('./user');
const Auth = require('./auth');

var _options = {};

/**
 */
module.exports = {
  init: options => {
    _options.rhizomeUrl = options.rhizomeUrl;
    _options.appToken = options.appToken || false;

    AppMetadata.init(_options);
    UserMetadata.init(_options);
    User.init(_options);
    Auth.init(_options);
  },
  Auth: {
    findOrCreateUser: Auth.findOrCreateUser
  },
  App: {
    loadMetadata: AppMetadata.load,
    saveMetadata: AppMetadata.save
  },
  User: {
    load: User.load,
    loadMetadata: UserMetadata.load,
    saveMetadata: UserMetadata.save
  }
};
