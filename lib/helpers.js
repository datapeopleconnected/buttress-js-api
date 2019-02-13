'use strict';

/**
 * Buttress API -
 *
 * @file auth.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const _checkOptions = options => {
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
		options.query.token = this._ButtressOptions.authToken;
	}

	return options;
};

module.exports = {
	checkOptions: _checkOptions
};
