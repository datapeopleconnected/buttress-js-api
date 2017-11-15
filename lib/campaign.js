"use strict";
/**
 * Buttress API -
 *
 * @file campaign.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const fs = require('fs');
const path = require('path');
const restler = require('restler');
const Buttress = require('./buttressjs');

const _getAll = () => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _loadCampaign = buttressCampaignId => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign/${buttressCampaignId}`;
    restler
      .get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _createCampaign = details => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign`;
    const json = JSON.stringify(details);
    restler
      .post(url, {
        query: {
          token: Buttress.authToken
        },
        headers: {'Content-Type': 'application/json', 'Content-Length': json.length},
        data: json
      })
      .on('success', data => resolve(data))
      .on('fail', (data, response) => {
        reject({
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          message: data.message
        });
      })
      .on('error', err => reject(err));
  });
};

const _saveAll = details => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign/bulk/add`;
    const json = JSON.stringify(details);
    restler
      .post(url, {
        query: {
          token: Buttress.authToken
        },
        headers: {'Content-Type': 'application/json', 'Content-Length': json.length},
        data: json
      })
      .on('success', data => resolve(data))
      .on('fail', (err, response) => {
        if (err.message) {
          reject(new Error(err.message));
          return;
        }
        reject(new Error(`${response.statusMessage} (${response.statusCode})`));
      })
      .on('error', err => reject(err));
  });
};

const _updateCampaign = (buttressId, details) => {
  return new Promise((resolve, reject) => {
    let json = JSON.stringify(details);
    let url = `${Buttress.url}/campaign/${buttressId}`;
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

const _addContactList = (buttressCampaignId, details) => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign/${buttressCampaignId}/contact-list`;
    restler
      .post(url, {
        query: {
          token: Buttress.authToken
        },
        data: details
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

const _removeCampaign = buttressCampaignId => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign/${buttressCampaignId}`;
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

const _removeContactList = (buttressCampaignId, buttressContactListId) => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign/${buttressCampaignId}/contact-list/${buttressContactListId}`;
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

const _removeAll = () => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign`;
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

const _addImage = (buttressCampaignId, details) => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign/${buttressCampaignId}/image`;

    if (!details.label) {
      reject(new Error("Missing required field: label"));
      return;
    }

    if (!details.imagePathName) {
      reject(new Error("Missing required field: imagePathName"));
      return;
    }

    if (path.extname(details.imagePathName) !== ".png") {
      reject(new Error("Currently only images in the PNG format are supported."));
      return;
    }

    fs.readFile(details.imagePathName, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      let encoded = Buffer.from(data, 'binary');
      restler
        .post(url, {
          query: {
            token: Buttress.authToken
          },
          data: {
            label: details.label,
            image: encoded.toString('base64'),
            format: path.extname(details.imagePathName)
          }
        })
        .on('success', data => resolve(data))
        .on('fail', err => reject(new Error(err.message)))
        .on('error', err => reject(err));
    });
  });
};
const _addEmailTemplate = (buttressCampaignId, details) => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign/${buttressCampaignId}/template`;

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
      let encoded = Buffer.from(data);
      restler
        .post(url, {
          query: {
            token: Buttress.authToken
          },
          data: {
            label: details.label,
            markup: encoded.toString('base64'),
            format: path.extname(details.templatePathName)
          }
        })
        .on('success', data => resolve(data))
        .on('fail', err => reject(new Error(err.message)))
        .on('error', err => reject(err));
    });
  });
};

const _createPreviewEmail = (buttressCampaignId, params) => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/campaign/${buttressCampaignId}`;
    restler
      .post(url, {
        query: {
          token: Buttress.authToken
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
  Type: {
    EMAIL: 'email',
    PHONE: 'phone',
    SOCIAL: 'social',
    COMBINED: 'combined'
  },
  getAll: _getAll,
  removeAll: _removeAll,
  load: _loadCampaign,
  create: _createCampaign,
  saveAll: _saveAll,
  update: _updateCampaign,
  remove: _removeCampaign,
  addContactList: _addContactList,
  removeContactList: _removeContactList,
  addImage: _addImage,
  addEmailTemplate: _addEmailTemplate,
  createPreviewEmail: _createPreviewEmail
};
