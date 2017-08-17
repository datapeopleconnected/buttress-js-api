"use strict";

/**
 * Buttress API -
 *
 * @file appointment.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');

const _getAll = buttressAuthToken => {
  let token = buttressAuthToken ? buttressAuthToken : Buttress.authToken;

  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/appointment`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

const _load = buttressId => {
  return new Promise((resolve, reject) => {
    const url = `${Buttress.url}/appointment/${buttressId}`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _create = details => {
  const json = JSON.stringify(details);
  return new Promise((resolve, reject) => {
    const url = `${Buttress.url}/appointment`;
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

const _update = (buttressId, details) => {
  const json = JSON.stringify(details);
  return new Promise((resolve, reject) => {
    const url = `${Buttress.url}/appointment/${buttressId}`;
    restler
      .put(url, {
        query: {
          token: Buttress.authToken
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
    const url = `${Buttress.url}/appointment`;
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
    const url = `${Buttress.url}/appointment/${buttressId}`;
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
