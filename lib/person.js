"use strict";

/**
 * Rhizome API -
 *
 * @file person.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Rhizome = require('./rhizome');

var _getAll = rhizomeAuthToken => {
  let token = rhizomeAuthToken ? rhizomeAuthToken : Rhizome.authToken;

  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/person`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

var _loadPerson = rhizomePersonId => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/person/${rhizomePersonId}`;
    restler.get(url, {query: {token: Rhizome.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _savePerson = details => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/person`;
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

var _removeAll = () => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/person`;
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

var _removePerson = rhizomePersonId => {
  return new Promise((resolve, reject) => {
    // var url = `${Rhizome.url}/person/1`;
    var url = `${Rhizome.url}/person/${rhizomePersonId}`;
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
  load: _loadPerson,
  save: _savePerson,
  remove: _removePerson
};
