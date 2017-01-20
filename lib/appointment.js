"use strict";

/**
 * Rhizome API -
 *
 * @file appointment.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Rhizome = require('./rhizome');

const _getAll = rhizomeAuthToken => {
  let token = rhizomeAuthToken ? rhizomeAuthToken : Rhizome.authToken;

  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/appointment`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

const _load = rhizomeId => {
  return new Promise((resolve, reject) => {
    const url = `${Rhizome.url}/appointment/${rhizomeId}`;
    restler.get(url, {query: {token: Rhizome.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _create = details => {
  const json = JSON.stringify(details);
  return new Promise((resolve, reject) => {
    const url = `${Rhizome.url}/appointment`;
    restler
      .post(url, {
        query: {
          token: Rhizome.authToken
        },
        headers: {'Content-Type': 'application/json', 'Content-Length': json.length},
        data: json
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _update = (rhizomeId, details) => {
  const json = JSON.stringify(details);
  return new Promise((resolve, reject) => {
    const url = `${Rhizome.url}/appointment/${rhizomeId}`;
    restler
      .put(url, {
        query: {
          token: Rhizome.authToken
        },
        headers: {'Content-Type': 'application/json', 'Content-Length': json.length},
        data: json
      })
      .on('success', data => resolve(data))
      .on('fail', () => resolve(false))
      .on('error', err => reject(err));
  });
};

const _removeAll = () => {
  return new Promise((resolve, reject) => {
    const url = `${Rhizome.url}/appointment`;
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
    const url = `${Rhizome.url}/appointment/${rhizomeId}`;
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

const outcomes = [
  'fail',
  'defer',
  'success'
];

module.exports = {
  getAll: _getAll,
  removeAll: _removeAll,
  create: _create,
  load: _load,
  update: _update,
  remove: _remove,
  Outcome: {
    FAIL: outcomes[0],
    DEFER: outcomes[1],
    SUCCESS: outcomes[2]
  }
};
