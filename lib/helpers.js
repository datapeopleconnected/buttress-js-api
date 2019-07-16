"use strict";

/**
 * Buttress API - Helpers
 *
 * @file helpers.js
 * @description
 * @author Lighten
 *
 */

const _checkOptions = (options, defaultToken) => {
  if (!options) {
    options = {};
  }
  if (!options.query) {
    options.query = {};
  }
  if (!options.data) {
    options.data = {};
  }
  if (!options.query.token) {
    options.query.token = defaultToken;
    // this._ButtressOptions.authToken;
  }

  return options;
};

module.exports = {
  checkOptions: _checkOptions
};
