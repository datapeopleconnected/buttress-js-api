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
var _options = null;

var _getAll = () => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/person`;
    restler.get(url, {query: {token: _options.appToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _loadPerson = rhizomePersonId => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/person/${rhizomePersonId}`;
    restler.get(url, {query: {token: _options.appToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _savePerson = details => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/person`;
    restler
      .post(url, {
        query: {
          token: _options.appToken
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
    var url = `${_options.rhizomeUrl}/person`;
    restler
      .del(url, {
        query: {
          token: _options.appToken
        }
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _removePerson = rhizomePersonId => {
  return new Promise((resolve, reject) => {
    // var url = `${_options.rhizomeUrl}/person/1`;
    var url = `${_options.rhizomeUrl}/person/${rhizomePersonId}`;
    restler
      .del(url, {
        query: {
          token: _options.appToken
        }
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

module.exports = {
  init: options => {
    _options = options;
  },
  getAll: _getAll,
  removeAll: _removeAll,
  load: _loadPerson,
  save: _savePerson,
  remove: _removePerson
};
