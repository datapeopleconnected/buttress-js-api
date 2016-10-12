"use strict";

/**
 * Rhizome API -
 *
 * @file config.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

var _init = () => {
  if (!process.env.RHIZOME_TEST_API_URL) {
    throw new Error("Missing required environment variable: RHIZOME_TEST_API_URL");
  }
  if (!process.env.RHIZOME_TEST_SUPER_APP_KEY) {
    throw new Error("Missing required environment variable: RHIZOME_TEST_SUPER_APP_KEY");
  }
};

module.exports = {
  init: _init,
  API_URL: process.env.RHIZOME_TEST_API_URL,
  SUPER_APP_KEY: process.env.RHIZOME_TEST_SUPER_APP_KEY
};
