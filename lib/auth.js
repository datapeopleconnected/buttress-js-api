'use strict';

/**
 * Buttress API -
 *
 * @file auth.js
 * @description
 * @author Chris Bates-Keegan
 *
 */
const axios = require('./axios');
const Buttress = require('./buttressjs');
const Helpers = require('./helpers');

/**
 * @param {Object} user - user details
 * @param {Object} auth - auth details
 * @param {Object} options - request options
 * @return {Promise} - resolves to the serialized User object
 * @private
 */
const _findOrCreateUser = (user, auth, options) => {
  options = Helpers.checkOptions(options);

  return axios.getInstance().get(`${Buttress.coreURL}/user/${user.app}/${user.id}`, {params: {token: Buttress.authToken}})
    .then((response) => {
      if (response.data === false) {
        return axios.getInstance().post(`${Buttress.coreURL}/user`, {user: user, auth: auth}, {params: {token: Buttress.authToken}});
      }

      return response;
    })
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

/**
 * @param {Object} userId - user id
 * @param {Object} token - token details
 * @return {Promise} - resolves to the serialized Token object
 * @private
 */
const _createToken = (userId, token) => {
  return axios.getInstance().post(`${Buttress.coreURL}/user/${userId}/token`, token, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

/**
 * @param {Object} userId - user details
 * @param {Object} appAuth - app auth details
 * @return {Promise} - resolves to the serialized User object
 * @private
 */
const _addAuthToUser = (userId, appAuth) => {
  return axios.getInstance().put(`${Buttress.coreURL}/user/${userId}/auth`, {params: {token: Buttress.authToken}, data: {auth: appAuth}})
    .then((response) => Object.assign(response.data, {
      buttressId: userId,
      buttressAuthToken: response.data.authToken,
    }))
    .catch((err) => Helpers.handleError(err));
};

module.exports = {
  findOrCreateUser: _findOrCreateUser,
  addAuthToUser: _addAuthToUser,
  createToken: _createToken,
};
