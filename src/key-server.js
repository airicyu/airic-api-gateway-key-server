'use strict';

const fs = require('fs');
const jwt = require('jsonwebtoken');

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http')
const httpShutdown = require('http-shutdown');

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
    getKeysDataStore: null,
    setKeysDataStore: null,
    inflatExpressApp: null,
    run: null,
    shutdown: null,
    implementations: {
        keysDataStore: {
            keysMemoryDataStore,
            keysSqliteDataStore,
            keysMongoDataStore,
            keysMysqlDataStore
        }
    }
}

keyServer.getKeysDataStore = function (dataStore) {
    return keysDataStoreHolder.getDataStore();
}.bind(keyServer);

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
        if (idKey === keyServer._config['admin-token']) {
            req.user = req.user || {};
            req.user.auth = req.user.auth || {};
            req.user.auth['admin'] = true;
            return true;
        } else {
            return false;
        }
    };

    const workspaceIdTokenFilter = (getValidateWorkspaceIdFunc) => {
        return async(req) => {
            let validateWorkspaceId = getValidateWorkspaceIdFunc ? await getValidateWorkspaceIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');
                if (!idKey){
                    return Promise.resolve(false);
                }
                let keyDecoded = jwt.verify(idKey, keyServer._publicKey, {
                    algorithm: 'RS256'
                });
                if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'workspace' &&
                    (validateWorkspaceId === null || keyDecoded['sub'] === validateWorkspaceId)) {
                    if (await keysDataStoreHolder.getDataStore().checkIdKeyExist({ key: idKey })) {
                        let subject = keyDecoded['sub'];
                        if (subject) {
                            req.user = req.user || {};
                            req.user.auth = req.user.auth || {};
                            req.user.auth['workspace'] = req.user.auth['workspace'] || {};
                            req.user.auth['workspace'][subject] = true;
                            return Promise.resolve(true);
                        } else {
                            return Promise.resolve(false);
                        }
                    }
                }
            } catch (e) {
            }
            return Promise.resolve(false);
        };
    };

    const workspaceIdSecretFilter = (getValidateWorkspaceIdFunc, getValidateWorkspaceSecretFunc) => {
        return async(req) => {
            let validateWorkspaceId = getValidateWorkspaceIdFunc ? await getValidateWorkspaceIdFunc(req) : null;
            let validateWorkspaceSecret = getValidateWorkspaceSecretFunc ? await getValidateWorkspaceSecretFunc(req) : null;
            try {
                let workspace = apiConfigHolder.get().workspaces[validateWorkspaceId];
                if (workspace && workspace.secret === validateWorkspaceSecret){
                    req.user = req.user || {};
                    req.user.auth = req.user.auth || {};
                    req.user.auth['workspace'] = req.user.auth['workspace'] || {};
                    req.user.auth['workspace'][validateWorkspaceId] = true;
                    return Promise.resolve(true);
                } else {
                    return Promise.resolve(false);
                }
            } catch (e) {
                console.error(e);
            }
            return Promise.resolve(false);
        };
    };

    const appIdTokenFilter = (getValidateAppIdFunc) => {
        return async(req) => {
            let validateAppId = getValidateAppIdFunc ? await getValidateAppIdFunc(req) : null;
            try {
                let idKey = req.header('id-key');
                if (!idKey){
                    return Promise.resolve(false);
                }
                let keyDecoded = jwt.verify(idKey, keyServer._publicKey, {
                    algorithm: 'RS256'
                });
                if (keyDecoded != null && keyDecoded['token-type'] === 'identity' && keyDecoded['sub-type'] === 'app' &&
                    (validateAppId === null || keyDecoded['sub'] === validateAppId)) {
                    if (await keysDataStoreHolder.getDataStore().checkIdKeyExist({ key: idKey })) {
                        let subject = keyDecoded['sub'];
                        if (subject) {
                            req.user = req.user || {};
                            req.user.auth = req.user.auth || {};
                            req.user.auth['app'] = req.user.auth['app'] || {};
                            req.user.auth['app'][subject] = true;
                            return Promise.resolve(true);
                        } else {
                            return Promise.resolve(false);
                        }
                    }
                }
            } catch (e) {}
            return Promise.resolve(false);
        };
    };

    const appIdSecretFilter = (getValidateAppIdFunc, getValidateAppSecretFunc) => {
        return async(req) => {
            let validateAppId = getValidateAppIdFunc ? await getValidateAppIdFunc(req) : null;
            let validateAppSecret = getValidateAppSecretFunc ? await getValidateAppSecretFunc(req) : null;
            try {
                let app = apiConfigHolder.get().apps[validateAppId];
                if (app && app.secret === validateAppSecret){
                    req.user = req.user || {};
                    req.user.auth = req.user.auth || {};
                    req.user.auth['app'] = req.user.auth['app'] || {};
                    req.user.auth['app'][validateAppId] = true;
                    return Promise.resolve(true);
                } else {
                    return Promise.resolve(false);
                }
            } catch (e) {}
            return Promise.resolve(false);
        };
    };

    app.post('/keys/workspaces/:workspaceId/id-keys',
    orPermisionFilter(
        adminTokenFilter,
        workspaceIdSecretFilter((req) => req.params.workspaceId, (req) => req.body.secret)
    ), (req, res) => {
        return keysController.generateWorkspaceIdKey(keyServer._privateKey, keyServer._publicKey, req, res);
    });

    app.post('/keys/workspaces/:workspaceId/apps/:appId/id-keys',
    orPermisionFilter(
        adminTokenFilter,
        workspaceIdTokenFilter((req) => req.params.workspaceId),
        appIdSecretFilter((req) => req.params.appId, (req) => req.body.secret)
    ), (req, res) => {
        return keysController.generateAppIdKey(keyServer._privateKey, keyServer._publicKey, req, res);
    });

    app.post('/keys/id-keys/verification', (req, res) => {
        return keysController.verifyIdKey(keyServer._config, keyServer._publicKey, req, res);
    });

    app.post('/keys/workspaces/:workspaceId/apps/:appId/api-keys',
    orPermisionFilter(
        adminTokenFilter,
        workspaceIdTokenFilter((req) => req.params.workspaceId),
        appIdTokenFilter((req) => req.params.appId)
    ),
    (req, res) => {
        return keysController.generateApiKey(keyServer._privateKey, keyServer._publicKey, req, res);
    });

    app.post('/keys/api-keys/verification', (req, res) => {
        return keysController.verifyApiKey(keyServer._config, keyServer._publicKey, req, res);
    });

}.bind(keyServer);

keyServer.run = async function (port) {
    let self = this;
    if (!self._app) {
        self.inflatExpressApp();
    }

    port = port || self._config['port'] || 3002;

    const privateKeyContent = fs.readFileSync(self._config['private-key-path'], 'utf8');
    self._privateKey = privateKeyContent;
    const publicKeyContent = fs.readFileSync(self._config['public-key-path'], 'utf8');
    self._publicKey = publicKeyContent;

    await apiConfigHolder.pullConfig(self._config);
    self.pullConfigInterval = setInterval(apiConfigHolder.pullConfig, self._config['pull-api-config-interval-second'] * 1000, self._config);

    self._server = http.createServer(self._app);
    self._server.listen(port);
    console.log(`Key server started with port ${port}`);
    self._server = httpShutdown(self._server);
    return Promise.resolve();

}.bind(keyServer);

keyServer.shutdown = async function (port) {
    let self = this;
    return new Promise((resolve, reject) => {
        clearInterval(self.pullConfigInterval);
        self._server.forceShutdown(() => {
            resolve();
        });
    });
}.bind(keyServer);

module.exports = keyServer;