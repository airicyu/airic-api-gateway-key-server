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

const ID_KEYS = 'idkeys';
const API_KEYS = 'apikeys';

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
    let safeKeyHash = safeHashJwtKey(key);
    let dbModel = {_id: safeKeyHash, workspaceId, subjectType, subject};
    return new Promise((resolve, reject) => {
        this._db.collection(ID_KEYS).insertOne(dbModel, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result && result.ops && result.ops[0] && result.ops[0]._id);
            }
        });
    });
}

dataStore.checkIdKeyExist = async function ({ key }) {
    let safeKeyHash = safeHashJwtKey(key);
    return new Promise((resolve, reject) => {
        this._db.collection(ID_KEYS).findOne({ _id: safeKeyHash }, (err, dbModel) => {
            if (err) {
                reject(err);
            } else if (dbModel) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

dataStore.deleteIdKey = async function ({ key }) {
    let safeKeyHash = safeHashJwtKey(key);
    
    return new Promise((resolve, reject) => {
        this._db.collection(ID_KEYS).findOneAndDelete({ _id: safeKeyHash }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}.bind(dataStore);

dataStore.saveApiKey = async function ({ key, workspaceId, appId, clientId }) {
    let safeKeyHash = safeHashJwtKey(key);
    let dbModel = {_id: safeKeyHash, workspaceId, appId, clientId};
    return new Promise((resolve, reject) => {
        this._db.collection(API_KEYS).insertOne(dbModel, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result && result.ops && result.ops[0] && result.ops[0]._id);
            }
        });
    });
}.bind(dataStore);

dataStore.checkApiKeyExist = async function ({ key }) {
    let safeKeyHash = safeHashJwtKey(key);
    return new Promise((resolve, reject) => {
        this._db.collection(API_KEYS).findOne({ _id: safeKeyHash }, (err, dbModel) => {
            if (err) {
                reject(err);
            } else if (dbModel) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}.bind(dataStore);

dataStore.deleteApiKey = async function ({ key }) {
    let safeKeyHash = safeHashJwtKey(key);
    
    return new Promise((resolve, reject) => {
        this._db.collection(API_KEYS).findOneAndDelete({ _id: safeKeyHash }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}.bind(dataStore);

module.exports.dataStore = dataStore;