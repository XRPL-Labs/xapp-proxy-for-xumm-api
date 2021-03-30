require('dotenv').config()
const { default: axios } = require('axios')
const express = require("express")
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require("helmet")
const morgan = require('morgan')
const jwt = require('jsonwebtoken')

const PORT = process.env.PORT || 3000
const app = express()

app.use(bodyParser.json())
app.use(helmet())
app.use(morgan('tiny'))

const corsOptions = {
    origin: ['http://localhost:8080', '*', 'https://xapp.loca.lt', 'http://127.0.0.1:8080'],
    // methods: 'GET, POST, OPTIONS'
}
app.use(cors(corsOptions))

axios.defaults.baseURL = 'https://xumm.app/api/v1/platform'
axios.defaults.headers.common['X-API-Key'] = process.env.XUMM_APIKEY
axios.defaults.headers.common['X-API-Secret'] = process.env.XUMM_APISECRET
axios.defaults.headers.post['Content-Type'] = 'application/json'

const authorize = (req, res, next) => {
    try {
        const decoded = jwt.verify(req.header('Authorization'), process.env.XAPP_SECRET)
        next()
    } catch(e) {
        res.status(403).json({
            msg: 'invalid token',
            error: e
        })
    }
}


// Todo set authorize middleware!!!
app.get('/curated-assets', async (req, res) => {
    try {
        const response = await axios.get('/curated-assets')
        res.json(response.data)
    } catch(e) {
        console.log(e)
        res.status(400).json({
            msg: e,
            error: true
        })
    }
})

app.get('/xapp/ott/:token', async (req, res) => {
    const token = req.params.token

    if (typeof token === undefined) {
        console.log('No token given respond 400')
        return res.status(400).json({
            msg: 'Token undefined',
            error: true
        })
    }

    try {
        const response = await axios.get(`/xapp/ott/${token}`)
        const authToken = jwt.sign({ ott: token}, process.env.XAPP_SECRET, { expiresIn: '15m' })
        response.data['token'] = authToken
        console.log(response.data)
        res.json(response.data)
    } catch(e) {
        console.log(e)
        res.status(400).json({
            msg: e,
            error: true
        })
    }

})

app.post('/payload', authorize, async (req, res) => {
    try {
        const response = await axios.post('/payload', req.body)
        console.log(response.data)
        res.json(response.data)
    } catch(e) {
        console.log(e)
        res.status(400).json({
            msg: e,
            error: true
        })
    }
})

app.get('/payload/:payload_uuid', authorize, async (req, res) => {
    const uuid = req.params.payload_uuid

    if (typeof uuid === undefined) {
        console.log('No token given respond 400')
        return res.status(400).json({
            msg: 'Token undefined',
            error: true
        })
    }

    try {
        const response = await axios.get(`/payload/${uuid}`)
        console.log(response.data)
        res.json(response.data)
    } catch(e) {
        console.log(e)
        res.status(400).json({
            msg: e,
            error: true
        })
    }
})

app.listen(process.env.PORT, () => {
    require('dns').lookup(require('os').hostname(), function (err, add, fam) {
        console.log(`App listening at http://${add}:${process.env.PORT}`)
        console.log(`And http://localhost:${process.env.PORT}`)
    })
})