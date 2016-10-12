/**
 * Rhizome API -
 *
 * @file campaign.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const fs = require('fs');
const path = require('path');
const restler = require('restler');
var _options = null;

var _loadCampaign = rhizomeCampaignId => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/campaign/${rhizomeCampaignId}`;
    restler
      .get(url, {query: {token: _options.appToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _createCampaign = details => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/campaign`;
    restler
      .post(url, {
        query: {
          token: _options.appToken
        },
        data: details
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _addImage = (rhizomeCampaignId, details) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/campaign`;

    if (!details.label) {
      reject(new Error("Missing required field: label"));
      return;
    }

    if (!details.imagePathName) {
      reject(new Error("Missing required field: imagePathName"));
      return;
    }

    if (path.extname(details.templatePathName) !== ".png") {
      reject(new Error("Currently only images in the PNG format are supported."));
      return;
    }

    fs.readFile(details.imagePathName, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      var encoded = Buffer.from(data, 'base64');
      restler
        .post(url, {
          query: {
            token: _options.appToken
          },
          data: {
            label: details.label,
            image: encoded,
            format: path.extname(details.imagePathName)
          }
        })
        .on('success', data => resolve(data))
        .on('fail', err => reject(new Error(err.message)))
        .on('error', err => reject(err));
    });
  });
};
var _addEmailTemplate = (rhizomeCampaignId, details) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/campaign`;

    if (!details.label) {
      reject(new Error("Missing required field: label"));
      return;
    }

    if (!details.templatePathName) {
      reject(new Error("Missing required field: templatePathName"));
      return;
    }

    if (path.extname(details.templatePathName) !== ".pug") {
      reject(new Error("Currently only templates in the PUG format are supported."));
      return;
    }

    fs.readFile(details.templatePathName, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      var encoded = Buffer.from(data, 'base64');
      restler
        .post(url, {
          query: {
            token: _options.appToken
          },
          data: {
            label: details.label,
            template: encoded,
            format: path.extname(details.templatePathName)

          }
        })
        .on('success', data => resolve(data))
        .on('fail', err => reject(new Error(err.message)))
        .on('error', err => reject(err));
    });
  });
};

var _createPreviewEmail = (rhizomeCampaignId, params) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/campaign/${rhizomeCampaignId}`;
    restler
      .post(url, {
        query: {
          token: _options.appToken
        },
        data: {
          params: JSON.stringify(params)
        }
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

module.exports = {
  init: options => {
    _options = options;
  },
  load: _loadCampaign,
  create: _createCampaign,
  addImage: _addImage,
  addEmailTemplate: _addEmailTemplate,
  createPreviewEmail: _createPreviewEmail
};
