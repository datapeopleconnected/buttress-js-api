"use strict";

/**
 * Buttress API -
 *
 * @file token.js
 * @description
 * @author Chris Bates-Keegan
 *
 */
const axios = require('axios');
const Buttress = require('./buttressjs');
const Helpers = require('./helpers');

/**
 * @return {Promise} - resolves when completed
 */
function _rmAllUserTokens(options) {
  options = Helpers.checkOptions(options, Buttress.authToken);

  return axios.delete(`${Buttress.coreURL}/token/user`, options)
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
}

const _updateRole = details => {
  return axios.put(`${Buttress.coreURL}/token/roles`, details, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

module.exports = {
  removeAllUserTokens: _rmAllUserTokens,
  updateRole: _updateRole,
  AuthLevel: {
    NONE: 0,
    USER: 1,
    ADMIN: 2,
    SUPER: 3
  }
};
