/**
 * Buttress API -
 *
 * @file campaign-metadata.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');

/**
 * @param {String} buttressCampaignId - id for the campaign
 * @param {String} key - identifier for the metadata
 * @param {*} defaultValue - default to return if metadata not in datastore
 * @return {Promise} - promise fulfilled with the value of the metadata
 * @private
 */
var _loadCampaignMetadata = (buttressCampaignId, key, defaultValue) => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/campaign/${buttressCampaignId}/metadata/${key}`;
    restler
      .get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('error', (data, response) => reject(response))
      .on('fail', (data, response) => {
        if (response.statusCode === 404) {
          resolve(defaultValue);
          return;
        }
        reject(new Error(`${response.statusCode}:${response.statusMessage}`));
      });
  });
};

var _saveCampaignMetadata = (buttressCampaignId, key, value) => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/campaign/${buttressCampaignId}/metadata/${key}`;
    restler
      .post(url, {
        query: {
          token: Buttress.authToken
        },
        data: {
          value: JSON.stringify(value)
        }
      })
      .on('error', err => reject(err))
      .on('success', data => resolve(data.value))
      .on('fail', err => reject(err));
  });
};

var _rmCampaignMetadata = (buttressCampaignId, key) => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/campaign/${buttressCampaignId}/metadata/${key}`;
    restler
      .del(url, {
        query: {
          token: Buttress.authToken
        }
      })
      .on('error', err => reject(err))
      .on('success', data => resolve(data))
      .on('fail', (data, response) => {
        if (response.statusCode === 404) {
          resolve('not_found');
          return;
        }
        reject(new Error(`${response.statusCode}:${response.statusMessage}`));
      });
  });
};

module.exports = {
  load: _loadCampaignMetadata,
  save: _saveCampaignMetadata,
  remove: _rmCampaignMetadata
};
