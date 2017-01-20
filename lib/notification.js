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

const _getAll = rhizomeAuthToken => {
  let token = rhizomeAuthToken ? rhizomeAuthToken : Rhizome.authToken;

  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/notification`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

const _load = rhizomeId => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/notification/${rhizomeId}`;
    restler.get(url, {query: {token: Rhizome.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _create = details => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/notification`;
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

const _update = (rhizomeId, details) => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/notification/${rhizomeId}`;
    restler
      .put(url, {
        query: {
          token: Rhizome.authToken
        },
        data: details
      })
      .on('success', data => resolve(data))
      .on('fail', () => resolve(false))
      .on('error', err => reject(err));
  });
};

const _removeAll = () => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/notification`;
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

const _remove = rhizomeId => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/notification/${rhizomeId}`;
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

const types = [
  'chat',
  'company',
  'campaign',
  'contact-list',
  'call'
];

module.exports = {
  getAll: _getAll,
  removeAll: _removeAll,
  create: _create,
  load: _load,
  update: _update,
  remove: _remove,
  Type: {
    CHAT: types[0],
    COMPANY: types[1],
    CAMPAIGN: types[2],
    CONTACT_LIST: types[3],
    CALL: types[4]
  }
};
