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
const Person = require('./person');
const PersonMetadata = require('./person-metadata');
const Auth = require('./auth');
const Campaign = require('./campaign');
const CampaignMetadata = require('./campaign-metadata');

var _options = {};

/**
 */
module.exports = {
  init: options => {
    _options.rhizomeUrl = options.rhizomeUrl || false;
    _options.appToken = options.appToken || false;

    AppMetadata.init(_options);
    UserMetadata.init(_options);
    User.init(_options);
    Person.init(_options);
    PersonMetadata.init(_options);
    Auth.init(_options);
    Campaign.init(_options);
    CampaignMetadata.init(_options);
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
    attachToPerson: User.attachToPerson,
    loadMetadata: UserMetadata.load,
    saveMetadata: UserMetadata.save,
    removeMetadata: UserMetadata.remove
  },
  Person: {
    getAll: Person.getAll,
    removeAll: Person.removeAll,
    load: Person.load,
    save: Person.save,
    remove: Person.remove,
    loadMetadata: PersonMetadata.load,
    saveMetadata: PersonMetadata.save,
    removeMetadata: PersonMetadata.remove
  },
  Campaign: {
    getAll: Campaign.getAll,
    removeAll: Campaign.removeAll,
    load: Campaign.load,
    create: Campaign.create,
    remove: Campaign.remove,
    addImage: Campaign.addImage,
    addEmailTemplate: Campaign.addEmailTemplate,
    createPreviewEmail: Campaign.createPreviewEmail,
    loadMetadata: CampaignMetadata.load,
    saveMetadata: CampaignMetadata.save,
    removeMetadata: CampaignMetadata.remove
  }
};
