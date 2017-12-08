'use strict';

const YAML = require('yamljs');
const request = require('request');

const configSource = {
    pull: null,
    getAppOpenApiSpec: null
};

configSource.pull = async function (keyServerConfig) {
    let configUrl = `${keyServerConfig['config-server-base-url']}/config/exportWithSecret`;
    return new Promise((resolve, reject) => {
        request(configUrl, {
                json: true,
                headers: {
                    'id-key': keyServerConfig['admin-token'] || ''
                }
            },
            function (error, response, body) {
                if (error) {
                    reject(error);
                } else if (response.statusCode === 200) {
                    resolve(body);
                } else {
                    resolve(null);
                }
            });
    });
}.bind(configSource);

module.exports.configSource = configSource;