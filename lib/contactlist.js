"use strict";

/**
 * Rhizome API -
 *
 * @file campaign.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Rhizome = require('./rhizome');

const PATH_PREFIX = 'contact-list';

const _getAll = () => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/${PATH_PREFIX}`;
    restler.get(url, {query: {token: Rhizome.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _loadContactList = rhizomeContactListId => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/${PATH_PREFIX}/${rhizomeContactListId}`;
    restler
      .get(url, {query: {token: Rhizome.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _removeAll = () => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/${PATH_PREFIX}`;
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
  load: _loadContactList,
  removeAll: _removeAll
};
