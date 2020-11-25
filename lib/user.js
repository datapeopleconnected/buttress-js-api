/**
 * Buttress API -
 *
 * @file user.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const axios = require('./axios');
const Buttress = require('./buttressjs');
const Helpers = require('./helpers');

/**
 * @return {promise}
 */
function _getAll() {
  return axios.getInstance().get(`${Buttress.coreURL}/user`, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

/**
 * @return {promise}
 */
function _rmAll() {
  return axios.getInstance().delete(`${Buttress.coreURL}/user`, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

/**
 * @param {string} appName
 * @param {string} appUserId
 * @return {promise}
 */
function _findUser(appName, appUserId) {
  return axios.getInstance().get(`${Buttress.coreURL}/user/${appName}/${appUserId}`, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

/**
 * @param {string} buttressUserId
 * @return {promise}
 */
function _loadUser(buttressUserId) {
  return axios.getInstance().get(`${Buttress.coreURL}/user/${buttressUserId}`, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

/**
 * @param {string} buttressId
 * @param {object} details
 * @return {promise}
 */
function _update(buttressId, details) {
  return axios.getInstance().put(`${Buttress.coreURL}/user/${buttressId}`, details, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

/**
 * @param {string} buttressUserId
 * @return {promise}
 */
function _removeUser(buttressUserId) {
  return axios.getInstance().delete(`${Buttress.coreURL}/user/${buttressUserId}`, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

module.exports = {
  getAll: _getAll,
  removeAll: _rmAll,
  remove: _removeUser,
  get: _loadUser,
  findUser: _findUser,
  update: _update,
};
