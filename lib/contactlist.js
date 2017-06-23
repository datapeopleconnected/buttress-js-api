"use strict";

/**
 * Buttress API -
 *
 * @file campaign.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');

const PATH_PREFIX = 'contact-list';

const _getAll = () => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/${PATH_PREFIX}`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _loadContactList = buttressContactListId => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/${PATH_PREFIX}/${buttressContactListId}`;
    restler
      .get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _createContactList = details => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/contact-list`;
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

const _removeAll = () => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/${PATH_PREFIX}`;
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
  load: _loadContactList,
  create: _createContactList,
  removeAll: _removeAll
};
