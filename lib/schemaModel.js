"use strict";

/**
 * Buttress API -
 *
 * @file organisation.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');

class SchemaModel {

	constructor(name) {
		this.schemaName = name.toLowerCase();
	}

	get(id) {
		return new Promise((resolve, reject) => {
			let url = `${Buttress.url}/${this.schemaName}/${id}`;
			restler.get(url, {query: {token: Buttress.authToken}})
				.on('success', data => resolve(data))
				.on('fail', err => reject(new Error(err.message)))
				.on('error', err => reject(err));
		});
	}

	save(details) {
		return new Promise((resolve, reject) => {
			let url = `${Buttress.url}/${this.schemaName}`;
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
	}

	update(id, details) {
		return new Promise((resolve, reject) => {
			let json = JSON.stringify(details);
			let url = `${Buttress.url}/${this.schemaName}/${id}`;
			restler
				.put(url, {
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
	}

	remove(id) {
		return new Promise((resolve, reject) => {
			let url = `${Buttress.url}/${this.schemaName}/${id}`;
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
	}

	getAll() {
		return new Promise((resolve, reject) => {
			var url = `${Buttress.url}/${this.schemaName}`;
			restler.get(url, {query: {token: Buttress.authToken}})
				.on('success', data => resolve(data))
				.on('fail', (data, response) => reject(new Error(response.statusMessage)))
				.on('error', err => reject(err));
		});
	};

	removeAll() {
		return new Promise((resolve, reject) => {
			var url = `${Buttress.url}/${this.schemaName}`;
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
	}

	bulkGet(buttressIds) {
		return new Promise((resolve, reject) => {
			let url = `${Buttress.url}/${this.schemaName}/bulk/load`;
			const json = JSON.stringify(buttressIds);
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
	}

	bulkSave(details) {
		return new Promise((resolve, reject) => {
			let url = `${Buttress.url}/${this.schemaName}/bulk/add`;
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
	}
	// bulkUpdate: _bulkUpdate,
	bulkRemove(ids) {
		return new Promise((resolve, reject) => {
			let url = `${Buttress.url}/${this.schemaName}/bulk/delete`;
			const json = JSON.stringify(ids);
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
	}

}

module.exports = SchemaModel;
