/**
 * Buttress API -
 *
 * @file user.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');

var _getAll = () => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _rmAll = () => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user`;
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

var _findUser = (appName, appUserId) => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user/${appName}/${appUserId}`;
    restler
      .get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _loadUser = buttressUserId => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user/${buttressUserId}`;
    restler
      .get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _update = (buttressId, details) => {
  return new Promise((resolve, reject) => {
    const url = `${Buttress.url}/user/${buttressId}`;
    const json = JSON.stringify(details);
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

var _removeUser = buttressUserId => {
  return new Promise((resolve, reject) => {
    // var url = `${Buttress.url}/person/1`;
    var url = `${Buttress.url}/user/${buttressUserId}`;
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
  removeAll: _rmAll,
  remove: _removeUser,
  load: _loadUser,
  findUser: _findUser,
  update: _update
};
