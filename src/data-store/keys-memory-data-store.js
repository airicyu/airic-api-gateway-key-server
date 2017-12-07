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

const store = {
    idKeys: {},
    apiKeys: {}
};

const dataStore = {
    saveIdKey: null,
    checkIdKeyExist: null,
    deleteIdKey: null,

    saveApiKey: null,
    checkApiKeyExist: null,
    deleteApiKey: null
}

dataStore.saveIdKey = async function ({key, workspaceId, subjectType, subject}) {
    let existingPrimaryKey = null;
    for(let [idKeyHash, keyAttributes] of Object.entries(store.idKeys)){
        if (keyAttributes.workspaceId === workspaceId
        && keyAttributes.subjectType === subjectType
        && keyAttributes.subject === subject){
            existingPrimaryKey = idKeyHash;
            break;
        }
    }
    if (existingPrimaryKey){
        delete store.idKeys[existingPrimaryKey];
    }

    let primaryKey = safeHashJwtKey(key);
    store.idKeys[primaryKey] = {
        workspaceId, subjectType, subject
    };
    return new Promise(resolve => resolve(primaryKey));
}

dataStore.checkIdKeyExist = async function ({key}) {
    let primaryKey = safeHashJwtKey(key);
    if (store.idKeys[primaryKey]){
        return new Promise(resolve => resolve(true));
    } else {
        return new Promise(resolve => resolve(false));
    }
}

dataStore.deleteIdKey = async function ({key}) {
    let primaryKey = safeHashJwtKey(key);
    if (store.idKeys[primaryKey]){
        delete store.idKeys[primaryKey];
        return new Promise(resolve => resolve(true));
    } else {
        return new Promise(resolve => resolve(false));
    }
}

dataStore.saveApiKey = async function ({key, workspaceId, appId, clientId}) {
    let existingPrimaryKey = null;
    for(let [apiKeyHash, keyAttributes] of Object.entries(store.apiKeys)){
        if (keyAttributes.workspaceId === workspaceId
        && keyAttributes.appId === appId
        && keyAttributes.clientId === clientId){
            existingPrimaryKey = apiKeyHash;
            break;
        }
    }
    if (existingPrimaryKey){
        delete store.apiKeys[existingPrimaryKey];
    }

    let primaryKey = safeHashJwtKey(key);
    store.apiKeys[primaryKey] = {
        key, workspaceId, appId, clientId
    }
    return new Promise(resolve => resolve(primaryKey));
}

dataStore.checkApiKeyExist = async function ({key}) {
    let primaryKey = safeHashJwtKey(key);
    if (store.apiKeys[primaryKey]){
        return new Promise(resolve => resolve(true));
    } else {
        return new Promise(resolve => resolve(false));
    }
}

dataStore.deleteApiKey = async function ({key}) {
    let primaryKey = md5Hash(key);
    if (store.apiKeys[primaryKey]){
        delete store.apiKeys[primaryKey];
        return new Promise(resolve => resolve(true));
    } else {
        return new Promise(resolve => resolve(false));
    }
}

module.exports.dataStore = dataStore;