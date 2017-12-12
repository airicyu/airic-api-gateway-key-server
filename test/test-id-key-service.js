'use strict';

const should = require('chai').should;
const expect = require('chai').expect;

const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
const request = require('request');
const jwt = require('jsonwebtoken');

const configServer = require('./test-server/mock-config-server');
const keyServer = require('./../index');

const ADMIN_TOKEN = 'd8745e9d03be41ad817a47176ade4dcc';
let workspaceId = '6ba955dde3044b6687af7b4d05a64920';
let workspaceSecret = 'c376f991c6744cfea1ccdad23356ab10';
let appId = 'b84cdbefe8ab42d38df0aa415030c4a1';
let appSecret = 'fd39eb34e94d41008cc0e196fdc5fc17';
let clientId = '4364938982b54da1807c599a955cdfcc';

const keyServerConfigYaml = YAML.load(path.resolve(__dirname, './test-server/key-server-config.yaml'));
keyServer.setConfig(keyServerConfigYaml);

const port = 3002;

describe('Test ID Key services', function () {
    this.timeout(5000);

    before(function (done) {
        configServer.start();
        done();
    });

    beforeEach(function (done) {
        keyServer.run().then(_ => {
            keyServer.getKeysDataStore().reset();
            done();
        });
    });

    var generateWorkspaceIdToken = async function () {
        return new Promise((resolve, reject) => {
            request(`http://localhost:${port}/keys/workspaces/${workspaceId}/id-keys`, {
                    method: 'POST',
                    headers: {
                        'id-key': ADMIN_TOKEN
                    },
                    body: {
                        state: 123
                    },
                    json: true
                },
                function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(body);
                    }
                });
        })
    };

    var generateAppIdToken = async function () {
        return new Promise((resolve, reject) => {
            request(`http://localhost:${port}/keys/workspaces/${workspaceId}/apps/${appId}/id-keys`, {
                    method: 'POST',
                    headers: {
                        'id-key': ADMIN_TOKEN
                    },
                    body: {
                        state: 123
                    },
                    json: true
                },
                function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(body);
                    }
                });
        })
    };

    it("Test generate workspace ID key with Admin Token", function (done) {
        request(`http://localhost:${port}/keys/workspaces/${workspaceId}/id-keys`, {
                method: 'POST',
                headers: {
                    'id-key': ADMIN_TOKEN,
                },
                json: true,
                body: {
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    let token = body;
                    let decodedToken = jwt.decode(token);
                    expect(decodedToken).to.not.be.null;
                    expect(decodedToken['token-type']).to.equal('identity');
                    expect(decodedToken['sub-type']).to.equal('workspace');
                    expect(decodedToken['sub']).to.equal(workspaceId);
                    expect(decodedToken['ver']).to.equal('1');
                    expect(decodedToken['state']).to.equal('123');
                    expect(decodedToken['iat']).to.gt(0);
                    done();
                }
            });
    });

    it("Test generate workspace ID key with workspace ID/secret", function (done) {
        request(`http://localhost:${port}/keys/workspaces/${workspaceId}/id-keys`, {
                method: 'POST',
                headers: {},
                json: true,
                body: {
                    "workspaceId": workspaceId,
                    "secret": workspaceSecret,
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    let token = body;
                    let decodedToken = jwt.decode(token);
                    expect(decodedToken).to.not.be.null;
                    expect(decodedToken['token-type']).to.equal('identity');
                    expect(decodedToken['sub-type']).to.equal('workspace');
                    expect(decodedToken['sub']).to.equal(workspaceId);
                    expect(decodedToken['ver']).to.equal('1');
                    expect(decodedToken['state']).to.equal('123');
                    expect(decodedToken['iat']).to.gt(0);
                    done();
                }
            });
    });

    it("Test generate workspace ID key with invalid token", function (done) {
        request(`http://localhost:${port}/keys/workspaces/${workspaceId}/id-keys`, {
                method: 'POST',
                headers: {
                    'id-key': "abc",
                },
                json: true,
                body: {
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(401);
                    done();
                }
            });
    });

    it("Test generate workspace ID key without auth", function (done) {
        request(`http://localhost:${port}/keys/workspaces/${workspaceId}/id-keys`, {
                method: 'POST',
                json: true,
                body: {
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(401);
                    done();
                }
            });
    });

    it("Test generate workspace ID key with incorrect workspace secret", function (done) {
        request(`http://localhost:${port}/keys/workspaces/${workspaceId}/id-keys`, {
                method: 'POST',
                json: true,
                body: {
                    "workspaceId": workspaceId,
                    "secret": "abc",
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(401);
                    done();
                }
            });
    });

    it("Test generate app ID key with Admin Token", function (done) {
        request(`http://localhost:${port}/keys/workspaces/${workspaceId}/apps/${appId}/id-keys`, {
                method: 'POST',
                headers: {
                    'id-key': ADMIN_TOKEN,
                },
                json: true,
                body: {
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    let token = body;
                    let decodedToken = jwt.decode(token);
                    expect(decodedToken).to.not.be.null;
                    expect(decodedToken['token-type']).to.equal('identity');
                    expect(decodedToken['sub-type']).to.equal('app');
                    expect(decodedToken['sub']).to.equal(appId);
                    expect(decodedToken['ver']).to.equal('1');
                    expect(decodedToken['state']).to.equal('123');
                    expect(decodedToken['iat']).to.gt(0);
                    done();
                }
            });
    });

    it("Test generate app ID key with workspace ID Token", function (done) {
        generateWorkspaceIdToken().then((workspaceIdToken) => {
            request(`http://localhost:${port}/keys/workspaces/${workspaceId}/apps/${appId}/id-keys`, {
                    method: 'POST',
                    headers: {
                        'id-key': workspaceIdToken,
                    },
                    json: true,
                    body: {
                        "state": "123"
                    }
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        let token = body;
                        let decodedToken = jwt.decode(token);
                        expect(decodedToken).to.not.be.null;
                        expect(decodedToken['token-type']).to.equal('identity');
                        expect(decodedToken['sub-type']).to.equal('app');
                        expect(decodedToken['sub']).to.equal(appId);
                        expect(decodedToken['ver']).to.equal('1');
                        expect(decodedToken['state']).to.equal('123');
                        expect(decodedToken['iat']).to.gt(0);
                        done();
                    }
                });
        })

    });

    it("Test generate app ID key with app ID/secret", function (done) {
        request(`http://localhost:${port}/keys/workspaces/${workspaceId}/apps/${appId}/id-keys`, {
                method: 'POST',
                headers: {},
                json: true,
                body: {
                    "appId": appId,
                    "secret": appSecret,
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    let token = body;
                    let decodedToken = jwt.decode(token);
                    expect(decodedToken).to.not.be.null;
                    expect(decodedToken['token-type']).to.equal('identity');
                    expect(decodedToken['sub-type']).to.equal('app');
                    expect(decodedToken['sub']).to.equal(appId);
                    expect(decodedToken['ver']).to.equal('1');
                    expect(decodedToken['state']).to.equal('123');
                    expect(decodedToken['iat']).to.gt(0);
                    done();
                }
            });
    });

    it("Test generate app ID key with invalid token", function (done) {
        request(`http://localhost:${port}/keys/workspaces/${workspaceId}/apps/${appId}/id-keys`, {
                method: 'POST',
                headers: {
                    'id-key': "abc",
                },
                json: true,
                body: {
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(401);
                    done();
                }
            });
    });

    it("Test generate app ID key without auth", function (done) {
        request(`http://localhost:${port}/keys/workspaces/${workspaceId}/apps/${appId}/id-keys`, {
                method: 'POST',
                json: true,
                body: {
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(401);
                    done();
                }
            });
    });

    it("Test generate app ID key with incorrect app secret", function (done) {
        request(`http://localhost:${port}/keys/workspaces/${workspaceId}/apps/${appId}/id-keys`, {
                method: 'POST',
                json: true,
                body: {
                    "appId": appId,
                    "secret": "abc",
                    "state": "123"
                }
            },
            function (error, response, body) {
                if (error) {
                    done(error);
                } else {
                    expect(response.statusCode).to.equal(401);
                    done();
                }
            });
    });

    it("Test verify workspace ID token", function (done) {
        generateWorkspaceIdToken().then((workspaceIdToken) => {
            request(`http://localhost:${port}/keys/id-keys/verification`, {
                    method: 'POST',
                    json: true,
                    body: {
                        'key': workspaceIdToken,
                    }
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        let expectedResponse = {
                            "result": true,
                            "token": {
                                "header": {
                                    "alg": "RS256",
                                    "typ": "JWT",
                                    "fingerprint": "fb:9c:c7:74:64:cb:c3:39:ec:18:fd:69:99:e9:af:26"
                                },
                                "payload": {
                                    "token-type": "identity",
                                    "sub-type": "workspace",
                                    "sub": workspaceId,
                                    "ver": "1",
                                    "state": "123",
                                    //"iat": 1513015977
                                }
                            }
                        };

                        expect(body.token.payload.iat).to.gt(0);
                        delete body.token.payload.iat;
                        expect(body).to.eqls(expectedResponse);
                        done();
                    }
                });
        });
    });

    it("Test verify app ID token", function (done) {
        generateAppIdToken().then((appIdToken) => {
            request(`http://localhost:${port}/keys/id-keys/verification`, {
                    method: 'POST',
                    json: true,
                    body: {
                        'key': appIdToken,
                    }
                },
                function (error, response, body) {
                    if (error) {
                        done(error);
                    } else {
                        let expectedResponse = {
                            "result": true,
                            "token": {
                                "header": {
                                    "alg": "RS256",
                                    "typ": "JWT",
                                    "fingerprint": "fb:9c:c7:74:64:cb:c3:39:ec:18:fd:69:99:e9:af:26"
                                },
                                "payload": {
                                    "token-type": "identity",
                                    "sub-type": "app",
                                    "sub": appId,
                                    "ver": "1",
                                    "state": "123",
                                    //"iat": 1513015977
                                }
                            }
                        };

                        expect(body.token.payload.iat).to.gt(0);
                        delete body.token.payload.iat;
                        expect(body).to.eqls(expectedResponse);
                        done();
                    }
                });
        });
    });

    it("Test verify ID token without token", function (done) {
        request(`http://localhost:${port}/keys/id-keys/verification`, {
            method: 'POST',
            json: true
        },
        function (error, response, body) {
            if (error) {
                done(error);
            } else {
                let expectedResponse = {result: false, code: 400, message: "Invalid key"};
                expect(body).to.eqls(expectedResponse);
                done();
            }
        });
    });

    it("Test verify invalid ID token", function (done) {
        request(`http://localhost:${port}/keys/id-keys/verification`, {
            method: 'POST',
            json: true,
            body: {
                'key': "abc",
            }
        },
        function (error, response, body) {
            if (error) {
                done(error);
            } else {
                let expectedResponse = {result: false, code: 400, message: "Invalid key"};
                expect(body).to.eqls(expectedResponse);
                done();
            }
        });
    });

    afterEach(function (done) {
        keyServer.shutdown().then(() => {
            done();
        });
    });

    after(function (done) {
        configServer.shutdown(()=>{
            done();
        });
    });
});