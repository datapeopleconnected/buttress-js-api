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
    let url = `${Buttress.url}/notification`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

const _load = buttressId => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/notification/${buttressId}`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _create = details => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/notification`;
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

const _update = (buttressId, details) => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/notification/${buttressId}`;
    let json = JSON.stringify(details);
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
    let url = `${Buttress.url}/notification`;
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
    let url = `${Buttress.url}/notification/${buttressId}`;
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
