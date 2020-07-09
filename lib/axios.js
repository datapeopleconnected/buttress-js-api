const axios = require('axios');
const http = require('http');
const https = require('https');

const options = {
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
};

let instance = axios.create(options);

const getInstance = () => {
  return instance;
}
const configure = (opts) => {
  if (opts.rejectUnauthorized === false) {
    options.httpsAgent = new https.Agent({
      keepAlive: true,
      rejectUnauthorized: false
    });
  }

  instance = axios.create(options);
};

module.exports = {
  getInstance,
  configure
};