require('dotenv').config()
const { default: axios } = require('axios')
const express = require("express")
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require("helmet")
const morgan = require('morgan')

const app = express()

app.use(bodyParser.json())
app.use(helmet())
app.use(morgan('tiny'))
app.use(cors())

axios.defaults.baseURL = 'https://xumm.app/api/v1/platform'
axios.defaults.headers.common['X-API-Key'] = process.env.API_KEY
axios.defaults.headers.common['X-API-Secret'] = process.env.API_SECRET
axios.defaults.headers.post['Content-Type'] = 'application/json'

app.get('/xapp/ott/:token', async (req, res) => {
    const token = req.params.token

    if (typeof token === undefined) {
        console.log('No token given respond 400')
        return res.status(400)
    }

    try {
        const response = await axios.get(`/xapp/ott/${token}`)
        console.log(response.data)
        res.json(response.data)
    } catch(e) {
        console.log(e)
        res.status(400).json({
            msg: e
        })
    }

})

app.post('/payload', async (req, res) => {
    try {
        const response = await axios.post('/payload', req.body)
        console.log(response.data)
        res.json(response.data)
    } catch(e) {
        console.log(e)
        res.status(400).json({
            msg: e
        })
    }
})

app.get('/payload/:payload_uuid', async (req, res) => {
    const uuid = req.params.payload_uuid

    if (typeof uuid === undefined) {
        console.log('No token given respond 400')
        return res.status(400)
    }

    try {
        const response = await axios.get(`/payload/${uuid}`)
        console.log(response.data)
        res.json(response.data)
    } catch(e) {
        console.log(e)
        res.status(400).json({
            msg: e
        })
    }
})

app.listen(process.env.PORT, () => {
    require('dns').lookup(require('os').hostname(), function (err, add, fam) {
        console.log(`App listening at http://${add}:${process.env.PORT}`)
        console.log(`And http://localhost:${process.env.PORT}`)
    })
})