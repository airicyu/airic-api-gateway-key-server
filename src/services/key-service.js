'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const pubre = /^(ssh-[dr]s[as]\s+)|(\s+.+)|\n/g;
function fingerprint(pub, alg) {
    alg = alg || 'md5'; // OpenSSH Standard

    var cleanpub = pub.replace(pubre, '');
    var pubbuffer = new Buffer(cleanpub, 'base64');
    var key = hash(pubbuffer, alg);

    return colons(key);
}

// hash a string with the given alg
function hash(s, alg) {
    return crypto.createHash(alg).update(s).digest('hex');
}

// add colons, 'hello' => 'he:ll:o'
function colons(s) {
    return s.replace(/(.{2})(?=.)/g, '$1:');
}

const keyServiceHolder = {
    _keyService: null,
    setKeyService: null,
    getKeyService: null,
}

keyServiceHolder.setKeyService = function(keyService){
    this._keyService = keyService;
}.bind(keyServiceHolder);

keyServiceHolder.getKeyService = function(){
    return this._keyService;
}.bind(keyServiceHolder);

const keyServiceInterface = {
    generateWorkspaceKey: null,
    generateAppKey: null,
    generateClientAppApiKey: null,
    verifyIdKey: null,
    verifyApiKey: null,
}

const defaultKeyServiceImpl = {
    generateWorkspaceKey: function (privateKey, publicKey, workspace, state, req) {
        const payload = {
            'token-type': 'identity',
            'sub-type': 'workspace',
            'sub': workspace.workspaceId,
            'ver': '1',
            'state': state,
        }
        return jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            header: {
                'fingerprint': fingerprint(publicKey)
            }
        });
    },
    generateAppKey: function (privateKey, publicKey, app, state, req) {
        const payload = {
            'token-type': 'identity',
            'sub-type': 'app',
            'sub': app.appId,
            'ver': '1',
            'state': state,
        }
        return jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            header: {
                'fingerprint': fingerprint(publicKey)
            }
        });
    },
    generateClientAppApiKey: function (privateKey, publicKey, client, app, state, req) {
        const payload = {
            'token-type': 'apiKey',
            'clientId': client.clientId,
            'appId': app.appId,
            'workspaceId': app.workspaceId,
            'ver': '1',
            'state': state,
        }
        return jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            header: {
                'fingerprint': fingerprint(publicKey)
            }
        });
    },
    verifyIdKey: function (idKey, publicKey, req) {
        return jwt.verify(idKey, publicKey, {
            algorithm: 'RS256'
        });
    },
    verifyApiKey: function (apiKey, publicKey, req) {
        return jwt.verify(apiKey, publicKey, {
            algorithm: 'RS256'
        });
    },
}

keyServiceHolder.setKeyService(defaultKeyServiceImpl);

module.exports.keyServiceHolder = keyServiceHolder;