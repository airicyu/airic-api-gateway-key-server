'use strict';

const crypto = require('crypto');

function safeHashJwtKey(key){
    let keySegments = key.split('.');
    if (keySegments.length !== 3){
        return null;
    } else {
        return md5Hash(keySegments[0]+'.'+keySegments[1]);
    }
}

function md5Hash(data) {
    return crypto.createHash('md5').update(data).digest("hex");
}

const dataStore = {
    _pool: null,
    registerConnectionPool: null,
    getConnection: null,
    saveIdKey: null,
    checkIdKeyExist: null,
    replaceIdKey: null,
    deleteIdKey: null,
    saveApiKey: null,
    checkApiKeyExist: null,
    replaceApiKey: null,
    deleteApiKey: null
}

dataStore.registerConnectionPool = function (pool) {
    this._pool = pool;
}.bind(dataStore);

dataStore.getConnection = async function () {
    let pool = this._pool;
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                return reject(err);
            } else {
                return resolve(connection);
            }
        });
    });
}.bind(dataStore);

dataStore.saveIdKey = async function ({ key, workspaceId, subjectType, subject }) {
    let connection = await this.getConnection();

    let safeKeyHash = safeHashJwtKey(key);
    let params = [workspaceId, subjectType, subject, safeKeyHash, safeKeyHash];

    return new Promise((resolve, reject) => {   
        connection.query('INSERT INTO `id_key` (`workspaceId`, `subjectType`, `subject`, `safeKeyHash`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `safeKeyHash` = ?', params, function (error, results, fields) {
            if (error) {
                connection.release();
                return reject(error);
            }

            let params = [workspaceId, subjectType, subject, safeKeyHash];
            connection.query('SELECT `id` FROM `id_key` WHERE `workspaceId` = ? AND `subjectType` = ? AND `subject` = ? AND `safeKeyHash` = ?', params, function (error, results, fields) {
                connection.release();
                if (error) {
                    return reject(error);
                }
                return resolve(results && results[0] && results[0].id);
            });
        });
    });
}.bind(dataStore);

dataStore.checkIdKeyExist = async function ({ key }) {
    let connection = await this.getConnection();

    let safeKeyHash = safeHashJwtKey(key);
    let params = [safeKeyHash];

    return new Promise((resolve, reject) => {
        connection.query('SELECT `id` FROM `id_key` WHERE `safeKeyHash` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                return reject(error);
            }
            if (results && results.length>0) {
                return resolve(true);
            } else {
                return resolve(false);
            }
        });
    });
}.bind(dataStore);

dataStore.deleteIdKey = async function ({ key }) {
    let connection = await this.getConnection();

    let safeKeyHash = safeHashJwtKey(key);
    let params = [safeKeyHash]

    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM `id_key` WHERE `safeKeyHash` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                reject(error);
            }
            resolve(results.affectedRows > 0);
        });
    });
}.bind(dataStore);

dataStore.saveApiKey = async function ({ key, workspaceId, appId, clientId }) {
    let connection = await this.getConnection();

    let safeKeyHash = safeHashJwtKey(key);
    let params = [workspaceId, appId, clientId, safeKeyHash, safeKeyHash];

    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO `api_key` (`workspaceId`, `appId`, `clientId`, `safeKeyHash`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `safeKeyHash` = ?', params, function (error, results, fields) {
            if (error) {
                connection.release();
                reject(error);
            }

            let params = [workspaceId, appId, clientId, safeKeyHash];
            connection.query('SELECT `id` FROM `api_key` WHERE `workspaceId` = ? AND `appId` = ? AND `clientId` = ? AND `safeKeyHash` = ?', params, function (error, results, fields) {
                connection.release();
                if (error) {
                    return reject(error);
                }
                return resolve(results && results[0] && results[0].id);
            });
        });
    });
}.bind(dataStore);

dataStore.checkApiKeyExist = async function ({ key }) {
    let connection = await this.getConnection();

    let safeKeyHash = safeHashJwtKey(key);
    let params = [safeKeyHash];

    return new Promise((resolve, reject) => {
        connection.query('SELECT `id` FROM `api_key` WHERE `safeKeyHash` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                reject(error);
            }
            if (results && results.length>0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}.bind(dataStore);

dataStore.deleteApiKey = async function ({ key }) {
    let connection = await this.getConnection();

    let safeKeyHash = safeHashJwtKey(key);
    let params = [safeKeyHash];

    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM `api_key` WHERE `safeKeyHash` = ?', params, function (error, results, fields) {
            connection.release();
            if (error) {
                reject(error);
            }
            resolve(results.affectedRows > 0);
        });
    });
}.bind(dataStore);

module.exports.dataStore = dataStore;