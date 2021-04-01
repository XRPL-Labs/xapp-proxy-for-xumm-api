# xApp Proxy for XUMM API

This repository is used to act as a bridge between an xAPP and the XUMM API, as you need your own backend for your SPA/frontend app to interact with the XUMM API. To use this proxy service, your application needs to send a specific header to resolve the XUMM xApp OTT:

```
const xummApiKey = 'the-public-API-key-received-from-the-xumm-dev-dashboard'

const urlParams = new URLSearchParams(window.location.search)
const oneTimeToken = urlParams.get('xAppToken') || ''

const ottEndpoint = `https://wherever-this-repo-is-running.com/xapp/ott/${oneTimeToken}`

const res = await axios(ottEndpoint, { headers: { 'x-api-key': xummApiKey } })
```

## Installation
Install dependencies with npm

```
npm install
```

## Running & debugging

Run with :
```
npm run serve
```

If you run using `node` / `nodemon` yourself you'll need to add the `DEBUG` env. var.
to see log output:

```
DEBUG=xapp* node index.js
```

## Running in production

See `pm2.config.js` for params;

To run / reload:

```
npm run pm2
```

Don't expose this service publicly, put a reverse proxy like nginx in front of the application, with a config like:

```
upstream @xappproxy {
    server 127.0.0.1:4000;
}

server {
  listen 443 ssl default_server;
  listen [::]:443 ssl default_server;

  include snippets/snakeoil.conf;
  root /var/www/;
  index index.html;
  server_name _;

  location / {
    if ($request_method = 'OPTIONS') {
      add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
      add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,X-API-Key,Authorization';
      add_header 'Access-Control-Max-Age' 1728000;
      add_header 'Content-Type' 'text/plain; charset=utf-8';
      add_header 'Content-Length' 0;
      return 204;
    }

    more_set_headers 'X-Notice: xumm.app';
    more_set_headers 'Access-Control-Allow-Origin: *';

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    proxy_pass http://@xappproxy;
  }
}
```

###### PM2 101:
- List processes: `./node_modules/pm2/bin/pm2 list`
- Monitor processes: `./node_modules/pm2/bin/pm2 monit`
- Logs & live log: `./node_modules/pm2/bin/pm2 logs`

### .env setup
Include a `.env` (or `.env.local`) file with the following data (see: `.env.sample`): 
```
PORT=3000
XAPP_bd4b5cb2_34aa_4aea_af08_48713855f0e8=9c793fe1-f150-4b1b-944f-c45273f15ac4
XAPP_7c6e3624_7787_4b65_b2e2_dd63294a8999=4ede72ac-8800-434f-b623-435c938fb844
XAPP_4e27d9e6_8cee_4ae8_b049_82cba3a7a5c6=c3161c32-a5d4-4818-8295-390801b151c1
XAPP_SECRET=JWTSECRET
```

The above example contains the keys for 3 (three) xApps (multi tenancy). The format
to provide the app keys:

XAPP_{the API Key with underscores instead of dashes}={the API Secret}

These values (API Key and API Secret) are the ones you can obtain from the
XUMM Developer Console at https://apps.xumm.dev
