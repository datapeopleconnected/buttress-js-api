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

const _getAll = buttressAuthToken => {
  let token = buttressAuthToken ? buttressAuthToken : Buttress.authToken;

  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/contract`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

const _load = buttressId => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/contract/${buttressId}`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _create = details => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/contract`;
    restler
      .post(url, {
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

const _saveAll = details => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/contract/bulk/add`;
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
      .on('fail', (err, response) => {
        if (err.message) {
          reject(new Error(err.message));
          return;
        }
        reject(new Error(`${response.statusMessage} (${response.statusCode})`));
      })
      .on('error', err => reject(err));
  });
};


const _update = (buttressId, details) => {
  return new Promise((resolve, reject) => {
    const url = `${Buttress.url}/contract/${buttressId}`;
    const json = JSON.stringify(details);
    restler
      .put(url, {
        query: {
          token: Buttress.authToken
        },
        headers: {'Content-Type': 'application/json', 'Content-Length': json.length},
        data: json
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _removeAll = () => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/contract`;
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

const _remove = buttressId => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/contract/${buttressId}`;
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

const statuses = [
  'pending',
  'in-progress',
  'deferred',
  'done'
];

module.exports = {
  getAll: _getAll,
  removeAll: _removeAll,
  create: _create,
  saveAll: _saveAll,
  load: _load,
  update: _update,
  remove: _remove,
  Status: {
    PENDING: statuses[0],
    IN_PROGRESS: statuses[1],
    DEFERRED: statuses[2],
    DONE: statuses[3],
  }
};
