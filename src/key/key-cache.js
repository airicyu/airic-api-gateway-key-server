'use strict';

const {getNewCacher} = require('./key-cacher');
const apiKeyCache = getNewCacher();
const idKeyCache = getNewCacher();

module.exports.apiKeyCache = apiKeyCache;
module.exports.idKeyCache = idKeyCache;