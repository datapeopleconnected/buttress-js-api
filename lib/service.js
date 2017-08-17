"use strict";

/**
 * Buttress API -
 *
 * @file service.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');

const _getAll = buttressAuthToken => {
  let token = buttressAuthToken ? buttressAuthToken : Buttress.authToken;

  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/service`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

const _load = buttressId => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/service/${buttressId}`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _save = details => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/service`;
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
          response: data.message
        });
      })
      .on('error', err => reject(err));
  });
};

const _saveAll = details => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/service/bulk/add`;
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
    let json = JSON.stringify(details);
    let url = `${Buttress.url}/service/${buttressId}`;
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
    let url = `${Buttress.url}/service`;
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
    let url = `${Buttress.url}/service/${buttressId}`;
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

const _bulkRemove = buttressIds => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/service/bulk/delete`;
    const json = JSON.stringify(buttressIds);
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

module.exports = {
  getAll: _getAll,
  removeAll: _removeAll,
  load: _load,
  save: _save,
  saveAll: _saveAll,
  update: _update,
  remove: _remove,
  bulkRemove: _bulkRemove
};
