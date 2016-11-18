/**
 * Rhizome API -
 *
 * @file user.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Rhizome = require('./rhizome');

var _getAll = () => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/user`;
    restler.get(url, {query: {token: Rhizome.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _rmAll = () => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/user`;
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

var _loadUser = rhizomeUserId => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/user/${rhizomeUserId}`;
    restler
      .get(url, {query: {token: Rhizome.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _attachToPerson = (rhizomeUserId, person) => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/user/${rhizomeUserId}`;
    restler
      .put(url, {
        query: {
          token: Rhizome.authToken
        },
        data: person
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _removeUser = rhizomeUserId => {
  return new Promise((resolve, reject) => {
    // var url = `${Rhizome.url}/person/1`;
    var url = `${Rhizome.url}/user/${rhizomeUserId}`;
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
  removeAll: _rmAll,
  remove: _removeUser,
  load: _loadUser,
  attachToPerson: _attachToPerson
};
