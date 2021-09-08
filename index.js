require('dotenv').config()
const log = require('debug')('xapp-backend')
const { default: axios } = require('axios')
const express = require("express")
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require("helmet")
const morganDebug = require('morgan-debug')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const PORT = process.env.PORT || 3000
const app = express()

log.log = console.log.bind(console)

app.use(bodyParser.json())
app.use(helmet())
app.use(morganDebug('xapp-backend:httplog', 'combined'))

const uuidv4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

app.use(cors({
  origin: (process.env?.CORS_ORIGINS || '').replace(/ +/g, ',').split(','),
  // methods: 'GET, POST, OPTIONS'
}))

/**
 * Available endpoints (proxied)
 *    Setup:
 *      GET
 *        /xapp/ott/:token
 *    JWT:
 *      GET
 *        /curated-assets
 *        /rates/:currency
 *        /payload/:payload_uuid
 *      POST
 *        /payload
 */

axios.defaults.baseURL = 'https://xumm.app/api/v1/platform'
axios.defaults.headers.common['Content-Type'] = 'application/json'
axios.defaults.headers.common['User-Agent'] = 'XUMM xApp Proxy 2.0.0'

const reqApiKeyMatch = (req, res, next) => {
  const reqApiKey = req.header('x-api-key')

  log(` --- reqApiKey: ${reqApiKey}`)
  if (typeof reqApiKey === 'string' && uuidv4.test(reqApiKey.trim())) {
    const envKey = 'XAPP_' + reqApiKey.trim().replace(/-/g, '_')
    if (Object.keys(process.env).indexOf(envKey) > -1) {
      // Attach prepared axios headers on this specific req.
      Object.assign(req, {
        xummAuthHeaders: {
          headers: {
            'X-API-Key': reqApiKey.trim(),
            'X-API-Secret': process.env[envKey]
          }
        }
      })

      return next()
    }
  }

  log('Invalid or missing req API key header')
  res.status(403).json({
    msg: 'Preflight error, missing API key header or invalid',
    error: true
  })
}

const authorize = (req, res, next) => {
  try {
    const decodedJwt = jwt.verify((req.header('Authorization') || '').replace(/^Bearer[: ]*/, ''), process.env.XAPP_SECRET)
    const reqApiKey = decodedJwt?.app

    if (typeof reqApiKey === 'string' && uuidv4.test(reqApiKey.trim())) {
      const envKey = 'XAPP_' + reqApiKey.trim().replace(/-/g, '_')
      if (Object.keys(process.env).indexOf(envKey) > -1) {
        // Attach prepared axios headers on this specific req.
        Object.assign(req, {
          xummAuthHeaders: {
            headers: {
              'X-API-Key': reqApiKey.trim(),
              'X-API-Secret': process.env[envKey]
            }
          }
        })

        // `return` to skip the error response, no code after here
        return next()
      }
    }

    log('Invalid or missing req API key in JWT')
    res.status(403).json({
      msg: 'JWT missing valid API Key',
      error: e.message
    })    
  } catch(e) {
    res.status(403).json({
      msg: 'invalid token',
      error: e.message
    })
  }
}

app.get('/curated-assets', authorize, async (req, res) => {
  try {
    const response = await axios.get('/curated-assets', req.xummAuthHeaders)
    res.json(response.data)
  } catch(e) {
    log(`XUMM API error @ curated assets: ${e.message}`)
    res.status(400).json({
      msg: e.message,
      error: true
    })
  }
})

app.get('/xapp/ott/:token', reqApiKeyMatch, async (req, res) => {
  const token = req.params.token
  
  if (typeof token !== 'string') {
    log('No token given respond 400')
    return res.status(400).json({
      msg: 'Token undefined / invalid',
      error: true
    })
  }

  if (!uuidv4.test(token)) {
    log('No token given respond 401')
    return res.status(401).json({
      msg: 'Invalid token format',
      error: true
    })
  }
  
  try {
    let url = `/xapp/ott/${token}`

    if (typeof process.env.DEVELOPMENT_MODE_DEVICE_ID !== 'undefined') {
      log('!! Signing hash for re-fetching OTT for device ID', process.env.DEVELOPMENT_MODE_DEVICE_ID)
      const data = `${token}.${req.xummAuthHeaders.headers['X-API-Secret']}.${process.env.DEVELOPMENT_MODE_DEVICE_ID}`

      const hash = crypto
        .createHash('sha1')
        .update(data.toUpperCase())
        .digest('hex')

        url += `/${hash}`
    }

    const response = await axios.get(url, req.xummAuthHeaders)
    const authToken = jwt.sign({
      ott: token,
      app: req.xummAuthHeaders.headers['X-API-Key']
    }, process.env.XAPP_SECRET, { expiresIn: '4h' })
    response.data['token'] = authToken

    log(response.data)
    res.json(response.data)
  } catch(e) {
    log(`XUMM API error @ ott fetch: ${e.message}`)
    res.status(400).json({
      msg: e.message,
      error: true
    })
  }
  
})

app.post('/payload', authorize, async (req, res) => {
  try {
    const response = await axios.post('/payload', req.body, req.xummAuthHeaders)
    log(response.data)
    res.json(response.data)
  } catch(e) {
    log(`XUMM API error @ payload post: ${e.message}`)
    res.status(400).json({
      msg: e.message,
      error: true
    })
  }
})

app.get('/payload/:payload_uuid', authorize, async (req, res) => {
  const uuid = req.params.payload_uuid
  
  if (typeof uuid === undefined) {
    log('No token given respond 400')
    return res.status(400).json({
      msg: 'Token undefined',
      error: true
    })
  }
  
  try {
    const response = await axios.get(`/payload/${uuid}`, req.xummAuthHeaders)
    log(response.data)
    res.json(response.data)
  } catch(e) {
    log(`XUMM API error @ payload get: ${e.message}`)
    res.status(400).json({
      msg: e.message,
      error: true
    })
  }
})

app.get('/rates/:currency', authorize, async (req, res) => {
  const currency = req.params.currency
  
  if (typeof currency === undefined) {
    log('No currency given respond 400')
    return res.status(400).json({
      msg: 'Currency undefined',
      error: true
    })
  }

  try {
    const response = await axios.get(`/rates/${currency}`, req.xummAuthHeaders)
    res.json(response.data)
  } catch {
    log(`XUMM API error @ rates got: ${e.message}`)
    res.status(400).json({
      msg: e,
      error: true
    })
  }
})

app.get('*', async (req, res) => {
  res.status(404).json({
    msg: 'Not found, see XUMM API Docs @ https://xumm.readme.io',
    error: true
  })
})

app.listen(PORT, () => {
  require('dns').lookup(require('os').hostname(), async (err, add, fam) => {
    log(`\nApp listening at http://${add}:${PORT}`)
    log(`                 http://localhost:${PORT}`)
    if (process.env.NGROK_URL) {
      log(`\n              »  ${process.env.NGROK_URL}`)
    }

    log(`\nEnvironment:`, Object.keys(process.env).filter(k => k.match(/^XAPP|PORT/)).reduce((a, b) => {
      const v = b.match(/secret|^XAPP_[0-9a-f]{8}_[0-9a-f]{4}/i)
        ? process.env[b].replace(/./g, '*')
        : process.env[b]
      Object.assign(a, {
        [b]: v
      })
      return a
    }, {}))
  })
})
