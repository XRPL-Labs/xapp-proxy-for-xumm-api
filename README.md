# xApp Proxy for XUMM API
This repository is used to act as a bridge between an xAPP and the XUMM API

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

### .env setup
Include a .env file with the following data: 
```
PORT=3000
API_KEY=7b36xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
API_SECRET=e8b7xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
XAPP_SECRET=...
```
