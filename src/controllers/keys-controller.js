'use strict';

const keyServiceHolder = require('./../services/key-service').keyServiceHolder;

const apiConfigHolder = require('./../config/api-config').apiConfigHolder;
const keyDataStoreHolder = require('./../data-store/keys-data-store').dataStoreHolder;

const apiKeyCache = require('./../key/key-cache').apiKeyCache;
const idKeyCache = require('./../key/key-cache').idKeyCache;

const generateWorkspaceIdKey = async(privateKey, publicKey, req, res) => {
    let workspaceId = req.params.workspaceId;

    let auth = false;
    let reqAuth = req.user && req.user.auth || {};
    if (reqAuth['admin']){
        auth = true;
    } else if (reqAuth['workspace'] && reqAuth['workspace'][workspaceId]){
        auth = true;
    }
    
    if (!auth) {
        return res.sendStatus(401);
    }

    let state = req.body.state || null;
    if (state != null) {
        state = state.toString();
        if (state.length > 50) {
            state = state.sub(0, 50);
        }
    }

    try {
        let workspace = apiConfigHolder.get().workspaces[workspaceId];
        if (!workspace) {
            return res.sendStatus(404);
        }

        let key = keyServiceHolder.getKeyService().generateWorkspaceKey(privateKey, publicKey, workspace, state, req);
        if (await keyDataStoreHolder.getDataStore().saveIdKey({
                key,
                workspaceId,
                subjectType: 'workspace',
                subject: workspaceId
            })) {
            return res.send(key);
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const generateAppIdKey = async(privateKey, publicKey, req, res) => {
    let workspaceId = req.params.workspaceId;
    let appId = req.params.appId;

    let auth = false;
    let reqAuth = req.user && req.user.auth || {};
    if (reqAuth['admin']){
        auth = true;
    } else if (reqAuth['workspace'] && reqAuth['workspace'][workspaceId]){
        auth = true;
    } else if (reqAuth['app'][appId]){
        auth = true;
    }

    if (!auth) {
        return res.sendStatus(401);
    }

    
    let state = req.body.state || null;
    if (state != null) {
        state = state.toString();
        if (state.length > 50) {
            state = state.sub(0, 50);
        }
    }

    try {
        let app = apiConfigHolder.get().apps[appId];
        if (!app || app.workspaceId !== req.params.workspaceId) {
            return res.sendStatus(404);
        }

        let key = keyServiceHolder.getKeyService().generateAppKey(privateKey, publicKey, app, state, req);
        if (await keyDataStoreHolder.getDataStore().saveIdKey({
                key,
                workspaceId: app.workspaceId,
                subjectType: 'app',
                subject: appId
            })) {
            return res.send(key);
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const verifyIdKey = async(config, publicKey, req, res) => {
    let idKey = req.body.key;
    if (!idKey) {
        return res.send({
            result: false,
            code: 400,
            message: 'Invalid key'
        });
    }

    try {
        let keyDecoded = keyServiceHolder.getKeyService().verifyIdKey(idKey, publicKey, req);
        if (keyDecoded) {
            
            let haveKey = false;

            let keyCacheResult = idKeyCache.get(idKey);
            if (keyCacheResult){
                if (!keyCacheResult.v){
                    return haveKey = false;
                } else if (Date.now() - keyCacheResult.t <= gatewayConfig['id-key-cache-max-second'] * 1000){
                    return haveKey = true;
                }
            } else {
                haveKey = await keyDataStoreHolder.getDataStore().checkIdKeyExist({
                    key: idKey
                });
            }

            if (haveKey) {
                let header = {};
                try {
                    header = JSON.parse(new Buffer(idKey.split('.')[0], 'base64').toString());
                } catch (e) {}
                return res.send({
                    result: true,
                    token: {
                        header: header,
                        payload: keyDecoded
                    }
                });
            } else {
                return res.send({
                    result: false,
                    code: 400,
                    message: 'Invalid key'
                });
            }
        } else {
            return res.send({
                result: false,
                code: 400,
                message: 'Invalid key'
            });
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

const generateApiKey = async(privateKey, publicKey, req, res) => {
    let workspaceId = req.params.workspaceId;
    let appId = req.params.appId;
    let state = req.body.state || null;
    if (state != null) {
        state = state.toString();
        if (state.length > 50){
            state = state.sub(0, 50);
        }
    }

    let auth = false;
    let reqAuth = req.user && req.user.auth || {};
    if (reqAuth['admin']){
        auth = true;
    } else if (reqAuth['workspace'] && reqAuth['workspace'][workspaceId]){
        auth = true;
    } else if (reqAuth['app'][appId]){
        auth = true;
    }

    if (!auth) {
        return res.sendStatus(401);
    }

    try {
        let app = apiConfigHolder.get().apps[appId];
        let client = apiConfigHolder.get().clients[clientId];

        if (!app || app.workspaceId !== req.params.workspaceId) {
            return res.sendStatus(404);
        }

        if (!app || app.workspaceId !== req.params.workspaceId || !client || client.workspaceId !== req.params.workspaceId) {
            return res.sendStatus(400);
        }

        let key = keyServiceHolder.getKeyService().generateClientAppApiKey(privateKey, publicKey, client, app, state, req);
        if (await keyDataStoreHolder.getDataStore().saveApiKey({
                key,
                workspaceId: app.workspaceId,
                appId: appId,
                clientId: clientId
            })) {
            return res.send(key);
        }
    } catch (error) {
        console.error(error);
    }

    res.sendStatus(500);
}

const verifyApiKey = async(config, publicKey, req, res) => {
    let apiKey = req.body.key;

    try {
        let keyDecoded = keyServiceHolder.getKeyService().verifyApiKey(apiKey, publicKey, req);
        if (keyDecoded) {

            let haveKey = false;
            
            let keyCacheResult = apiKeyCache.get(apiKey);
            if (keyCacheResult){
                if (!keyCacheResult.v){
                    return haveKey = false;
                } else if (Date.now() - keyCacheResult.t <= gatewayConfig['api-key-cache-max-second'] * 1000){
                    return haveKey = true;
                }
            } else {
                haveKey = await keyDataStoreHolder.getDataStore().checkApiKeyExist({
                    key: apiKey
                });
            }

            if (haveKey) {
                let header = {};
                try {
                    header = JSON.parse(new Buffer(apiKey.split('.')[0], 'base64').toString());
                } catch (e) {}
                return res.send({
                    result: true,
                    token: {
                        header: header,
                        payload: keyDecoded
                    }
                });
            } else {
                return res.send({
                    result: false,
                    code: 400,
                    message: 'Invalid key'
                });
            }
        } else {
            return res.send({
                result: false,
                code: 400,
                message: 'Invalid key'
            });
        }
    } catch (error) {
        console.error(error);
    }

    return res.sendStatus(500);
}

module.exports = {
    generateWorkspaceIdKey,
    generateAppIdKey,
    generateApiKey,
    verifyIdKey,
    verifyApiKey
};