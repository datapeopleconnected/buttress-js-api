"use strict";

/**
 * Rhizome API -
 *
 * @file organisation.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Rhizome = require('./rhizome');

var _getAll = rhizomeAuthToken => {
  let token = rhizomeAuthToken ? rhizomeAuthToken : Rhizome.authToken;

  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/org`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

var _loadOrg = rhizomeOrgId => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/org/${rhizomeOrgId}`;
    restler.get(url, {query: {token: Rhizome.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _saveOrg = details => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/org`;
    restler
      .post(url, {
        query: {
          token: Rhizome.authToken
        },
        data: details
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _updateOrg = (rhizomeOrgId, details) => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/org/${rhizomeOrgId}`;
    restler
      .put(url, {
        query: {
          token: Rhizome.authToken
        },
        data: details
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _removeAll = () => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/org`;
    restler
      .del(url, {
        query: {
          token: Rhizome.authToken
        }
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _removeOrg = rhizomeOrgId => {
  return new Promise((resolve, reject) => {
    // var url = `${Rhizome.url}/org/1`;
    var url = `${Rhizome.url}/org/${rhizomeOrgId}`;
    restler
      .del(url, {
        query: {
          token: Rhizome.authToken
        }
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

module.exports = {
  getAll: _getAll,
  removeAll: _removeAll,
  load: _loadOrg,
  save: _saveOrg,
  update: _updateOrg,
  remove: _removeOrg,
  Type: {
    COMPANY: 'company',
    CHARITY: 'charity',
    EDUCATION: 'education',
    POLITICAL: 'political'
  }
};
