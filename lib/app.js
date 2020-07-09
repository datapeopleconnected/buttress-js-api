"use strict";

/**
 * Buttress API -
 *
 * @file app.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const axios = require('./axios');
const Buttress = require('./buttressjs');
const Helpers = require('./helpers');

const _getSchema = buttressId => {
  return axios.getInstance().get(`${Buttress.coreURL}/app/schema`, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

const _getAll = buttressAuthToken => {
  const token = buttressAuthToken ? buttressAuthToken : Buttress.authToken;
  return axios.getInstance().get(`${Buttress.coreURL}/app`, {params: {token: token}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

const _load = buttressId => {
  return axios.getInstance().get(`${Buttress.coreURL}/app/${buttressId}`, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

const _save = details => {
  return axios.getInstance().post(`${Buttress.coreURL}/app`, details, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

const _update = (buttressId, details) => {
  return axios.getInstance().put(`${Buttress.coreURL}/app/${buttressId}`, details, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

const _remove = buttressId => {
  return axios.getInstance().delete(`${Buttress.coreURL}/app/${buttressId}`, {params: {token: Buttress.authToken}})
    .then((response) => response.data)
    .catch((err) => Helpers.handleError(err));
};

module.exports = {
  getSchema: _getSchema,
  getAll: _getAll,
  get: _load,
  save: _save,
  update: _update,
  remove: _remove
};
