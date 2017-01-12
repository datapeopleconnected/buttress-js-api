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
    let url = `${Rhizome.url}/call`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

const _load = rhizomeId => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/call/${rhizomeId}`;
    restler.get(url, {query: {token: Rhizome.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _create = details => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/call`;
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
    let url = `${Rhizome.url}/call/${rhizomeId}`;
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

const _removeAll = () => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/call`;
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
    let url = `${Rhizome.url}/call/${rhizomeId}`;
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

const status = [
  'unallocated',
  'allocated',
  'completed'
];

const connectionOutcome = [
  'no-answer',
  'engaged',
  'invalid-number',
  'connected-wrong-number',
  'connected-not-available',
  'connected'
];

const outcome = [
  'call-back',
  'not-interested',
  'appointment-made',
  'successful-transaction'
];

module.exports = {
  getAll: _getAll,
  removeAll: _removeAll,
  create: _create,
  load: _load,
  update: _update,
  remove: _remove,
  Status: {
    UNALLOCATED: status[0],
    ALLOCATED: status[1],
    COMPLETED: status[2]
  },
  ConnectionOutcome: {
    NO_ANSWER: connectionOutcome[0],
    ENGAGED: connectionOutcome[1],
    INVALID: connectionOutcome[2],
    CONNECTED_WRONG_NUMBER: connectionOutcome[3],
    CONNECTED_NOT_AVAILABLE: connectionOutcome[4],
    CONNECTED: connectionOutcome[5]
  },
  Outcome: {
    CALL_BACK: outcome[0],
    NOT_INTERESTED: outcome[1],
    APPOINTMENT_MADE: outcome[2],
    SUCCESSFUL_TRANSACTION: outcome[3]
  }
};
