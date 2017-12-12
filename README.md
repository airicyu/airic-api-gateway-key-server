# airic-api-gateway-key-server

[![npm version](https://img.shields.io/npm/v/airic-api-gateway-key-server.svg)](https://www.npmjs.com/package/airic-api-gateway-key-server)
[![node](https://img.shields.io/node/v/airic-api-gateway-key-server.svg)](https://www.npmjs.com/package/airic-api-gateway-key-server)
[![Codecov branch](https://img.shields.io/codecov/c/github/airicyu/airic-api-gateway-key-server/master.svg)](https://codecov.io/gh/airicyu/airic-api-gateway-key-server)
[![Build](https://travis-ci.org/airicyu/airic-api-gateway-key-server.svg?branch=master)](https://travis-ci.org/airicyu/airic-api-gateway-key-server)

[![dependencies Status](https://david-dm.org/airicyu/airic-api-gateway-key-server/status.svg)](https://david-dm.org/airicyu/airic-api-gateway-key-server)
[![devDependencies Status](https://david-dm.org/airicyu/airic-api-gateway-key-server/dev-status.svg)](https://david-dm.org/airicyu/airic-api-gateway-key-server?type=dev)

## Description

airic-api-gateway-key-server module is the ID key/API key server component of airic-api-gateway.

------------------------

## Samples

### Hello world

Starting server:

```javascript
'use strict';
const YAML = require('yamljs');
const keyServer = require('airic-api-gateway-key-server');

const keyServerConfigYaml = YAML.load('./key-server-config.yaml');
keyServer.setConfig(keyServerYaml);

keyServer.run();
```

------------------------

## Key Server Config YAML

Sample:
```yaml
port: 3002
admin-token: d8745e9d03be41ad817a47176ade4dcc
pull-api-config-interval-second: 60
config-server-base-url: http://localhost:3001
id-key-cache-max-second: 15
api-key-cache-max-second: 10
private-key-path : './system-key-dir/private-key.pem'
public-key-path : './system-key-dir/public-key.pem'
```


------------------------

## REST APIs

### Generate Workspace ID key (with admin token)
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/id-keys
Content-type: application/json
id-key: {{adminToken}}

```

### Generate Workspace ID key (with workspace ID/secret)
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/id-keys
Content-type: application/json
id-key: {{adminToken}}

{
    "workspaceId": "{{workspaceId}}",
    "secret": "{{workspaceSecret}}"
}
```

### Generate App ID key (with admin token)
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}/id-keys
Content-type: application/json
id-key: {{adminToken}}

```

### Generate App ID key (with workspace ID key)
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}/id-keys
Content-type: application/json
id-key: {{workspaceIdKey}}

```

### Generate App ID key (with app ID/secret)
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}/id-keys
Content-type: application/json
id-key: {{adminToken}}

{
    "appId": "{{appId}}",
    "secret": "{{appSecret}}"
}
```

### Verify Workspace ID key or App ID key
```
POST http://localhost:3001/keys/id-keys/verification
Content-type: application/json

{
    "key": "{{workspaceIdKey}}"
}
```

```
POST http://localhost:3001/keys/id-keys/verification
Content-type: application/json

{
    "key": "{{appIdKey}}"
}
```

### Register App API key for Client
```
POST http://localhost:3001/config/workspaces/{{workspaceId}}/apps/{{appId}}/api-keys
Content-type: application/json
id-key: {{adminToken}}

{
    "clientId": "{{clientId}}"
}
```

### Verify API key
```
POST http://localhost:3001/keys/api-keys/verification
Content-type: application/json

{
    "key": "{{apiKey}}"
}
```