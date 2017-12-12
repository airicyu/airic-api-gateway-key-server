const express = require('express');
const bodyParser = require('body-parser');
const http = require('http')
const httpShutdown = require('http-shutdown');

var server;
const port = 3001;

module.exports = {
    start: function () {
        var app = express();
        app.get('/config/exportWithSecret', (req, res) => {
            res.send({
                "workspaces": {
                    "6ba955dde3044b6687af7b4d05a64920": {
                        "workspaceId": "6ba955dde3044b6687af7b4d05a64920",
                        "secret": "c376f991c6744cfea1ccdad23356ab10",
                        "displayName": "Demo Workspace",
                        "createTime": 1512418737565,
                        "updateTime": 1512418737565,
                        "apps": {
                            "b84cdbefe8ab42d38df0aa415030c4a1": {
                                "appId": "b84cdbefe8ab42d38df0aa415030c4a1",
                                "secret": "fd39eb34e94d41008cc0e196fdc5fc17",
                                "workspaceId": "6ba955dde3044b6687af7b4d05a64920",
                                "displayName": "Petstore",
                                "openAPISpecLastUpdateTime": 1512418809143,
                                "quotaRule": {
                                    "plan a": {
                                        "app": [{
                                            "quota": 100000000,
                                            "bucket": "1m"
                                        }],
                                        "tag": {
                                            "store": [{
                                                "quota": 100000000,
                                                "bucket": "1m"
                                            }]
                                        },
                                        "operation": {
                                            "placeOrder": [{
                                                "quota": 100000000,
                                                "bucket": "1m"
                                            }]
                                        }
                                    }
                                },
                                "createTime": 1512418737565,
                                "updateTime": 1512418737565
                            }
                        },
                        "clients": {
                            "4364938982b54da1807c599a955cdfcc": {
                                "clientId": "4364938982b54da1807c599a955cdfcc",
                                "secret": "4af18e30-85b6-4c14-aecd-c489d404a179",
                                "workspaceId": "6ba955dde3044b6687af7b4d05a64920",
                                "displayName": "Client A",
                                "plans": {
                                    "b84cdbefe8ab42d38df0aa415030c4a1": [
                                        "plan a"
                                    ]
                                },
                                "createTime": 1512418737565,
                                "updateTime": 1512418737565
                            }
                        }
                    }
                }
            });
        });

        server = http.createServer(app);
        server.listen(port);
        server = httpShutdown(server);
    },
    shutdown: function (cb) {
        server.forceShutdown(() => {
            cb();
        });
    }
}