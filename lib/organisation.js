"use strict";

/**
 * Buttress API -
 *
 * @file organisation.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');

var _getAll = buttressAuthToken => {
  let token = buttressAuthToken ? buttressAuthToken : Buttress.authToken;

  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/org`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

var _loadOrg = buttressOrgId => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/org/${buttressOrgId}`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _saveOrg = details => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/org`;
    const json = JSON.stringify(details);
    restler
      .post(url, {
        query: {
          token: Buttress.authToken
        },
        headers: {'Content-Type': 'application/json', 'Content-Length': json.length},
        data: json
      })
      .on('success', data => resolve(data))
      .on('fail', (data, response) => {
        reject({
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          message: data.message
        });
      })
      .on('error', err => reject(err));
  });
};

var _updateOrg = (buttressOrgId, details) => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/org/${buttressOrgId}`;
    restler
      .put(url, {
        query: {
          token: Buttress.authToken
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
    var url = `${Buttress.url}/org`;
    restler
      .del(url, {
        query: {
          token: Buttress.authToken
        }
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _removeOrg = buttressOrgId => {
  return new Promise((resolve, reject) => {
    // var url = `${Buttress.url}/org/1`;
    var url = `${Buttress.url}/org/${buttressOrgId}`;
    restler
      .del(url, {
        query: {
          token: Buttress.authToken
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
