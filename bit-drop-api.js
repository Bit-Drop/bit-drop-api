#!/usr/bin/env node
'use strict'

const env = require('node-env-file')
env(__dirname + '/config/config.env')

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const db = require('./utils/DbPool')
const _ = require('lodash')

const Tile = require('./controllers/tile')

app.get('/', (req, res) => {
  res.send('Hello!')
})

app.get('/tiles/:zoom/:x/:y.png', (req, res) => {
  Tile(req, res)
})

app.post('/set-tile', bodyParser.json(), (req, res) => {
  res.json(_.defaults(req.body, { success: true }))
})

app.listen(process.env.PORT, () => {
  console.log('Listening on port ' + process.env.PORT)
})
