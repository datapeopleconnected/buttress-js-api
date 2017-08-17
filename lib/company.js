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
    let url = `${Buttress.url}/company`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

const _bulkLoad = buttressIds => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/company/bulk/load`;
    restler
      .get(url, {
        query: {
          token: Buttress.authToken,
          ids: buttressIds.join(',')
        }
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _load = buttressId => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/company/${buttressId}`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _save = details => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/company`;
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

const _saveAll = details => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/company/bulk/add`;
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
    let url = `${Buttress.url}/company/${buttressId}`;
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
    let url = `${Buttress.url}/company`;
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
    let url = `${Buttress.url}/company/${buttressId}`;
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
    let url = `${Buttress.url}/company/bulk/delete`;
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

const employeeBands = [
  '1-4',
  '5-9',
  '10-19',
  '20-99',
  '100-499',
  '500-999',
  '1000-1999',
  '2000-4999',
  '5000-10000',
  '>10000'
];

const turnoverBands = [
  '0-99k',
  '100k-199k',
  '200k-299k',
  '300k-499k',
  '500k-999k',
  '1m-4.99m',
  '5m-10m',
  '>10m'
];

module.exports = {
  getAll: _getAll,
  removeAll: _removeAll,
  bulkLoad: _bulkLoad,
  load: _load,
  save: _save,
  saveAll: _saveAll,
  update: _update,
  remove: _remove,
  bulkRemove: _bulkRemove,
  EmployeeBands: {
    BAND_1: employeeBands[0],
    BAND_2: employeeBands[1],
    BAND_3: employeeBands[2],
    BAND_4: employeeBands[3],
    BAND_5: employeeBands[4],
    BAND_6: employeeBands[5],
    BAND_7: employeeBands[6],
    BAND_8: employeeBands[7],
    BAND_9: employeeBands[8],
    BAND_10: employeeBands[9]
  },
  RevenueBands: {
    BAND_1: turnoverBands[0],
    BAND_2: turnoverBands[1],
    BAND_3: turnoverBands[2],
    BAND_4: turnoverBands[3],
    BAND_5: turnoverBands[4],
    BAND_6: turnoverBands[5],
    BAND_7: turnoverBands[6],
    BAND_8: turnoverBands[7]
  }
};
