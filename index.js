var express = require('express')
var app = express()

var Tile = require('./controllers/tile')

app.get('/', function (req, res) {
  res.send('Hello!')
})

app.get('/tiles/:zoom/:x/:y.png', function (req, res) {
  Tile(req, res)
})

app.listen(3400, function () {
  console.log('Listening on port 3400')
})
