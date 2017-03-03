"use strict";

/**
 * Buttress API -
 *
 * @file person.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');

var _getAll = buttressAuthToken => {
  let token = buttressAuthToken ? buttressAuthToken : Buttress.authToken;

  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/person`;
    restler.get(url, {query: {token: token}})
      .on('success', data => resolve(data))
      .on('fail', (data, response) => reject(new Error(response.statusMessage)))
      .on('error', err => reject(err));
  });
};

var _loadPerson = buttressPersonId => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/person/${buttressPersonId}`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _savePerson = details => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/person`;
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

var _removeAll = () => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/person`;
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

var _removePerson = buttressPersonId => {
  return new Promise((resolve, reject) => {
    // var url = `${Buttress.url}/person/1`;
    var url = `${Buttress.url}/person/${buttressPersonId}`;
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
  load: _loadPerson,
  save: _savePerson,
  remove: _removePerson
};
