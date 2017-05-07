const fs = require('fs')
const Jimp = require('jimp')
const async = require('async')

const MIN_ZOOM = 12
const MAX_ZOOM = 16
const EMPTY_TILE = [255, 255, 255, 0]

function getDbTile(db, z, x, y, cb) {
  db.query('SELECT * FROM tiles WHERE id=$1 LIMIT 1', [`${z}-${x}-${y}`], (err, result) => {
    if (err) {
      console.error(err)
      return cb(err)
    } else if (err || result.rowCount !== 1) {
      return cb(new Error('Tile not found'))
    } else {
      return cb(null, result.rows[0].data)
    }
  })
}

function createImage(data) {
  if (!data) {
    data = EMPTY_TILE
  }
  var size = Math.sqrt(data.length / 4)
  var image = new Jimp(size, size)
  image.bitmap.data = Buffer.from(data)
  return image
}

function isInt(value) {
  if (isNaN(value)) {
    return false;
  }
  var x = parseFloat(value);
  return (x | 0) === x;
}

function resize256(image) {
  var size = 256
  var ratio = size / image.bitmap.width
  if (isInt(ratio) && ratio > 1) {
    var src = image.clone()
    var data = []
    var idx = 0
    for (var j = 0; j < src.bitmap.height; j++) {
      var row = []
      for (var k = 0; k < src.bitmap.width; k++) {
        for (var r = 0; r < ratio; r++) {
          var d = src.bitmap.data
          row.push(d[idx])
          row.push(d[idx + 1])
          row.push(d[idx + 2])
          row.push(d[idx + 3])
        }
        idx += 4
      }
      for (var r = 0; r < ratio; r++) {
        data = data.concat(row)
      }
    }
    image = new Jimp(size, size)
    image.bitmap.data = new Buffer(data)
    image.bitmap.height = size
    image.bitmap.width = size
    return image
  } else {
    image.resize(size, size)
    // image.resize(size, size, Jimp.RESIZE_NEAREST_NEIGHBOR)
  }
}

function findTile(db, z, x, y, tile, cb) {
  if (!tile) {
    tile = EMPTY_TILE
  }

  if (z === MAX_ZOOM) {
    getDbTile(db, z, x, y, function(err, dbTile) {
      cb(null, err ? tile : dbTile)
    })

  } else if (z > MAX_ZOOM) {
    // Zooming out
    var d = Math.pow(2, z - MAX_ZOOM)
    getDbTile(db, MAX_ZOOM, Math.floor(x/d), Math.floor(y/d), function(err, dbTile) {
      if (err || !dbTile) {
        cb(null, tile)
      } else {
        cb(null, dbTile)
      }
    })

  } else if (z >= MIN_ZOOM ) {
    // Zooming in
    async.parallel({
      tl: function(cb) {
        findTile(db, z + 1, x * 2, y * 2, tile, function(err, dbTile) {
          cb(err, createImage(dbTile))
        })
      },
      tr: function(cb) {
        findTile(db, z + 1, x * 2 + 1, y * 2, tile, function(err, dbTile) {
          cb(err, createImage(dbTile))
        })
      },
      bl: function(cb) {
        findTile(db, z + 1, x * 2, y * 2 + 1, tile, function(err, dbTile) {
          cb(err, createImage(dbTile))
        })
      },
      br: function(cb) {
        findTile(db, z + 1, x * 2 + 1, y * 2 + 1, tile, function(err, dbTile) {
          cb(err, createImage(dbTile))
        })
      },
    }, function(err, results) {
      if (err) {
        return cb(null, tile)
      }
      console.log(JSON.stringify(results, null, 2))
      const size = results.tl.bitmap.width * 2
      const image = new Jimp(size, size)
      image.composite(results.tl, 0, 0)
      image.composite(results.tr, size/2, 0)
      image.composite(results.bl, 0, size/2)
      image.composite(results.br, size/2, size/2)
      tile = []
      for (let i = 0; i < image.bitmap.data.length; i++) {
        tile.push(image.bitmap.data[i])
      }
      cb(null, tile)
    })

  } else {
    cb(null, tile)
  }
}

module.exports = function(db, req, res) {
  const zoom = parseInt(req.params.zoom, 10)
  const x = parseInt(req.params.x, 10)
  const y = parseInt(req.params.y, 10)
  console.log(`${zoom}/${x}/${y}`)
  findTile(db, zoom, x, y, null, function(err, tile) {
    if (tile) {
      let image = createImage(tile)
      image = resize256(image)
      image.getBuffer(Jimp.MIME_PNG, function(err, buffer) {
        if (err) {
          console.log(err)
          res.status(404).end()
        }
        res.set('Content-Type', Jimp.MIME_JPEG)
        res.send(buffer)
      })
    } else {
      res.status(404).end()
    }
  })
}
