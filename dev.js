#!/usr/bin/env node

const log = require('debug')('xapp-backend:dev-launcher')

require('dotenv').config()

if (String(process.env.DEVELOPMENT_MODE || '').toUpperCase() !== 'TRUE') {
  log('Do not use `npm run dev` in production, run `npm run serve`.')
  process.exitCode = 1
  return
}

const ngrok = require('ngrok')
const nodemon = require('nodemon')

ngrok
  .connect({
    proto: 'http',
    addr: process.env.PORT || 3000
  })
  .then((url) => {
    log(`🎉 ngrok tunnel opened at: ${url}\n\n`);

    nodemon({
      script: './index.js',
      exec: `NGROK_URL=${url} node`,
    }).on('start', () => {
      log('» Proxy has started')
    }).on('restart', files => {
      log(`\n» Proxy restarted due to:`)
      files.forEach(file => log(`    - ${file}`))
    }).on('quit', () => {
      log('» Proxy has quit, closing ngrok tunnel')
      ngrok.kill().then(() => process.exit(0))
    });
  })
  .catch((error) => {
    log('Error opening ngrok tunnel: ', error)
    process.exitCode = 1
  })
