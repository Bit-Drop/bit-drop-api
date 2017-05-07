#!/usr/bin/env node
'use strict'

const env = require('node-env-file')
env(__dirname + '/config/config.env')

const express = require('express')
const app = express()

const Tile = require('./controllers/tile')

app.get('/', (req, res) => {
  res.send('Hello!')
})

app.get('/tiles/:zoom/:x/:y.png', (req, res) => {
  Tile(req, res)
})

app.listen(process.env.PORT, () => {
  console.log('Listening on port ' + process.env.PORT)
})
