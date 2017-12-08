'use strict';

const fs = require('fs');
const jwt = require('jsonwebtoken');

const express = require('express');
const bodyParser = require('body-parser');

const apiConfigHolder = require('./config/api-config').apiConfigHolder;
const keysDataStoreHolder = require('./data-store/keys-data-store').dataStoreHolder;
const keysController = require('./controllers/keys-controller');

const keysMemoryDataStore = require('./data-store/keys-memory-data-store').dataStore;
const keysSqliteDataStore = require('./data-store/keys-sqlite-data-store').dataStore;
const keysMysqlDataStore = require('./data-store/keys-mysql-data-store').dataStore;
const keysMongoDataStore = require('./data-store/keys-mongo-data-store').dataStore;

const apiKeyCache = require('./key/key-cache').apiKeyCache;
const idKeyCache = require('./key/key-cache').idKeyCache;

const keyServer = {
    _app: null,
    _privateKey: null,
    _publicKey: null,
    _config: {
        'admin-token': null,
        'pull-api-config-interval-second': 60,
        'config-server-base-url': 'http://localhost:3001'
    },
    setConfig: null,
    setKeysDataStore: null,
    inflatExpressApp: null,
    run: null,
    implementations: {
        keysDataStore: {
            keysMemoryDataStore,
            keysSqliteDataStore,
            keysMongoDataStore,
            keysMysqlDataStore
        }
    }
}

keyServer.setKeysDataStore = function (dataStore) {
    keysDataStoreHolder.setDataStore(dataStore);
}.bind(keyServer);

keyServer.setConfig = function (config) {
    this._config = config;
}.bind(keyServer);

keyServer.inflatExpressApp = function (app) {
    this._app = app || express();
    app = this._app;

    app.use(bodyParser.json({
        limit: '100mb'
    }));

    const orPermisionFilter = (...orPermissionCheckers) => {
        return async(req, res, next) => {
            let result = false;
            for (let orPermissionChecker of orPermissionCheckers) {
                if (await orPermissionChecker(req)) {
                    result = true;
                    break;
                }
            }

            return Promise.resolve(result ? next() : res.sendStatus(401));
        }
    }

    const adminTokenFilter = (req) => {
        let idKey = req.header('id-key');
        return (idKey === keyServer._config['admin-token']);
    }

    const workspaceIdTokenFilter = (getValidateWorkspaceIdFunc) => {
        return async(req) => {
            let validateWorkspaceId = getValidateWorkspaceIdFunc ? await getValidateWorkspaceIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');
                let keyDecoded = jwt.verify(idKey, keyServer._publicKey, {
                    algorithm: 'RS256'
                });
                if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'workspace' &&
                    (validateWorkspaceId === null || keyDecoded['sub'] === validateWorkspaceId)) {

                    let keyCacheResult = idKeyCache.get(idKey);
                    if (keyCacheResult) {
                        if (!keyCacheResult.v) {
                            return Promise.resolve(false);
                        } else if (Date.now() - keyCacheResult.t <= gatewayConfig['id-key-cache-max-second'] * 1000) {
                            return Promise.resolve(true);
                        }
                    } else if (await keysDataStoreHolder.getDataStore().checkIdKeyExist({ key: idKey })) {
                        let subject = keyDecoded['sub'];
                        return Promise.resolve(subject);
                    }
                }
            } catch (e) {}
            return Promise.resolve(false);
        };
    }

    const appIdTokenFilter = (getValidateAppIdFunc) => {
        return async(req) => {
            let validateAppId = getValidateAppIdFunc ? await getValidateAppIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');
                let keyDecoded = jwt.verify(idKey, keyServer._publicKey, {
                    algorithm: 'RS256'
                });
                if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'app' &&
                    (validateAppId === null || keyDecoded['sub'] === validateAppId)) {

                    let keyCacheResult = idKeyCache.get(idKey);
                    if (keyCacheResult) {
                        if (!keyCacheResult.v) {
                            return Promise.resolve(false);
                        } else if (Date.now() - keyCacheResult.t <= gatewayConfig['id-key-cache-max-second'] * 1000) {
                            return Promise.resolve(true);
                        }
                    } else if (await keysDataStoreHolder.getDataStore().checkIdKeyExist({ key: idKey })) {
                        let subject = keyDecoded['sub'];
                        return Promise.resolve(subject);
                    }
                }
            } catch (e) {}
            return Promise.resolve(false);
        };
    }

    app.post('/keys/id-key', orPermisionFilter(adminTokenFilter), (req, res) => {
        let subjectType = req.body.subjectType;
        if (subjectType === 'workspace') {
            return keysController.generateWorkspaceIdKey(keyServer._privateKey, keyServer._publicKey, req, res);
        } else if (subjectType === 'app') {
            return keysController.generateAppIdKey(keyServer._privateKey, keyServer._publicKey, req, res);
        }
    });

    app.post('/keys/id-key/verification', (req, res) => {
        return keysController.verifyIdKey(keyServer._config, keyServer._publicKey, req, res);
    });

    app.post('/keys/api-key', orPermisionFilter(
        adminTokenFilter,
        workspaceIdTokenFilter(async (req) => {
            let config = apiConfigHolder.get();
            if (config.apps[req.body.appId]){
                return Promise.resolve(config.apps[req.body.appId].workspaceId);
            } else {
                return Promise.resolve(undefined);
            }
        }),
        appIdTokenFilter(async (req) => Promise.resolve(req.body.appId))
    ), (req, res) => {
        return keysController.generateApiKey(keyServer._privateKey, keyServer._publicKey, req, res);
    });

    app.post('/keys/api-key/verification', (req, res) => {
        return keysController.verifyApiKey(keyServer._config, keyServer._publicKey, req, res);
    });

}.bind(keyServer);

keyServer.run = async function (port) {
    if (!this._app) {
        this.inflatExpressApp();
    }

    port = port || this._config['port'] || 3002;

    const privateKeyContent = fs.readFileSync(this._config['private-key-path'], 'utf8');
    this._privateKey = privateKeyContent;
    const publicKeyContent = fs.readFileSync(this._config['public-key-path'], 'utf8');
    this._publicKey = publicKeyContent;

    await apiConfigHolder.pullConfig(this._config);
    setInterval(apiConfigHolder.pullConfig, this._config['pull-api-config-interval-second'] * 1000, this._config);

    return new Promise(resolve => {
        this._app.listen(port, function () {
            console.log(`Key server started with port ${port}`);
            resolve();
        });
    });

}.bind(keyServer);

module.exports = keyServer;