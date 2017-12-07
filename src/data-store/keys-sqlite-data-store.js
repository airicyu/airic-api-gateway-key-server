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
    _db: null,
    registerDB: null,
    saveIdKey: null,
    checkIdKeyExist: null,
    replaceIdKey: null,
    deleteIdKey: null,
    saveApiKey: null,
    checkApiKeyExist: null,
    replaceApiKey: null,
    deleteApiKey: null
}

dataStore.registerDB = function (db) {
    this._db = db;
}.bind(dataStore);

dataStore.saveIdKey = async function ({ key, workspaceId, subjectType, subject }) {
    let db = this._db;

    let safeKeyHash = safeHashJwtKey(key);
    let params = [workspaceId, subjectType, subject, safeKeyHash];

    return new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO `id_key` (`workspaceId`, `subjectType`, `subject`, `safeKeyHash`) VALUES (?, ?, ?, ?)', params, function (error) {
            if (error) {
                return reject(error);
            }

            let params = [workspaceId, subjectType, subject, safeKeyHash];
            db.get('SELECT `id` FROM `id_key` WHERE `workspaceId` = ? AND `subjectType` = ? AND `subject` = ? AND `safeKeyHash` = ?', params, function (error, row) {
                if (error) {
                    return reject(error);
                }
                return resolve(row && row.id);
            });
        });
    });
}.bind(dataStore);

dataStore.checkIdKeyExist = async function ({ key }) {
    let db = this._db;

    let safeKeyHash = safeHashJwtKey(key);
    let params = [safeKeyHash];

    return new Promise((resolve, reject) => {
        db.get('SELECT `id` FROM `id_key` WHERE `safeKeyHash` = ?', params, function (error, row) {
            if (error) {
                return reject(error);
            }
            if (row) {
                return resolve(true);
            } else {
                return resolve(false);
            }
        });
    });
}.bind(dataStore);

dataStore.deleteIdKey = async function ({ key }) {
    let db = this._db;

    let safeKeyHash = safeHashJwtKey(key);
    let params = [safeKeyHash]

    return new Promise((resolve, reject) => {
        db.run('DELETE FROM `id_key` WHERE `safeKeyHash` = ?', params, function (error) {
            if (error) {
                reject(error);
            }
            resolve(true);
        });
    });
}.bind(dataStore);

dataStore.saveApiKey = async function ({ key, workspaceId, appId, clientId }) {
    let db = this._db;

    let safeKeyHash = safeHashJwtKey(key);
    let params = [workspaceId, appId, clientId, safeKeyHash];

    return new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO `api_key` (`workspaceId`, `appId`, `clientId`, `safeKeyHash`) VALUES (?, ?, ?, ?)', params, function (error) {
            if (error) {
                reject(error);
            }

            let params = [workspaceId, appId, clientId, safeKeyHash];
            db.get('SELECT `id` FROM `api_key` WHERE `workspaceId` = ? AND `appId` = ? AND `clientId` = ? AND `safeKeyHash` = ?', params, function (error, row) {
                if (error) {
                    return reject(error);
                }
                return resolve(row && row.id);
            });
        });
    });
}.bind(dataStore);

dataStore.checkApiKeyExist = async function ({ key }) {
    let db = this._db;

    let safeKeyHash = safeHashJwtKey(key);
    let params = [safeKeyHash];

    return new Promise((resolve, reject) => {
        db.get('SELECT `id` FROM `api_key` WHERE `safeKeyHash` = ?', params, function (error, row) {
            if (error) {
                reject(error);
            }
            if (row) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}.bind(dataStore);

dataStore.deleteApiKey = async function ({ key }) {
    let db = this._db;

    let safeKeyHash = safeHashJwtKey(key);
    let params = [safeKeyHash];

    return new Promise((resolve, reject) => {
        db.run('DELETE FROM `api_key` WHERE `safeKeyHash` = ?', params, function (error) {
            connection.release();
            if (error) {
                reject(error);
            }
            resolve(true);
        });
    });
}.bind(dataStore);

module.exports.dataStore = dataStore;