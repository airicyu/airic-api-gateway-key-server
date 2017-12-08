'use strict';

const loggerHolder = require('./../logger/logger');
const configSource = require('./api-config-source-util').configSource;

const apiConfigHolder = {
    configSource: configSource,
    _lastConfigUpdateTime: null,
    config: {
        workspaces: {},
        apps: {},
        clients: {}
    },
    get: null,
    pullConfig: null
}

apiConfigHolder.get = function () {
    return this.config;
}.bind(apiConfigHolder);



apiConfigHolder.pullConfig = async function (keyServerConfig) {
    loggerHolder.getLogger().log(new Date().toISOString(), 'API Key Server pulling API config');

    let pullTime = Date.now();

    let newConfig;
    try {
        newConfig = await this.configSource.pull(keyServerConfig);
    } catch (e) {
        loggerHolder.getLogger().error(e);
    }
    
    if (newConfig){
        newConfig.apps = newConfig.apps || {};
        newConfig.clients = newConfig.clients || {};
        for(let [workspaceId, workspace] of Object.entries(newConfig.workspaces)){
            for(let [appId, app] of Object.entries(workspace.apps)){
                newConfig.apps = newConfig.apps || {};
                newConfig.apps[appId] = newConfig.apps[appId] || app;
            }
            for(let [clientId, client] of Object.entries(workspace.clients)){
                newConfig.clients = newConfig.clients || {};
                newConfig.clients[clientId] = newConfig.clients[clientId] || client;
            }
        }
        this.config.workspaces = newConfig.workspaces;
        this.config.apps = newConfig.apps;
        this.config.clients = newConfig.clients;
        loggerHolder.getLogger().log(new Date().toISOString(), 'API Key Server pulled API config');
        return;
    } else {
        return Promise.reject();
    }    
}.bind(apiConfigHolder);

module.exports.apiConfigHolder = apiConfigHolder;