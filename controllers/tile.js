var fs = require('fs')
var Jimp = require('jimp')

var min_zoom = 12
var max_zoom = 16
var tiles = {
  16: {
    39106: {
      26595: [255, 0, 255, 160],
      26596: [255, 0, 0, 160]
    },
    39107: {
      26595: [0, 0, 255, 160],
      26596: [0, 255, 0, 160]
    }
  }
}

function createImage(data) {
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

function findTile(z, x, y, tile) {
  if (!tile) {
    tile = [255, 255, 255, 0]
  }
  if (z === max_zoom) {
    if (tiles[z] && tiles[z][x] && tiles[z][x][y]) {
      tile = tiles[z][x][y]
    }
    return tile
  } else if (z > max_zoom) {
    // Zooming out
    var d = Math.pow(2, z - max_zoom)
    if (tiles[max_zoom] && tiles[max_zoom][Math.floor(x/d)] && tiles[max_zoom][Math.floor(x/d)][Math.floor(y/d)]) {
      tile = tiles[max_zoom][Math.floor(x/d)][Math.floor(y/d)]
    }
  } else if (z >= min_zoom ) {
    // Zooming in
    var tl = createImage(findTile(z + 1, x * 2, y * 2, tile))
    var tr = createImage(findTile(z + 1, x * 2 + 1, y * 2, tile))
    var bl = createImage(findTile(z + 1, x * 2, y * 2 + 1, tile))
    var br = createImage(findTile(z + 1, x * 2 + 1, y * 2 + 1, tile))
    var size = tl.bitmap.width * 2
    image = new Jimp(size, size)
    image.composite(tl, 0, 0)
    image.composite(tr, size/2, 0)
    image.composite(bl, 0, size/2)
    image.composite(br, size/2, size/2)
    tile = []
    for (var i = 0; i < image.bitmap.data.length; i++) {
      tile.push(image.bitmap.data[i])
    }
  }
  return tile
}

module.exports = function(req, res) {
  var zoom = parseInt(req.params.zoom, 10)
  var x = parseInt(req.params.x, 10)
  var y = parseInt(req.params.y, 10)
  console.log(`${zoom}/${x}/${y}`)
  var tile = findTile(zoom, x, y)
  if (tile) {
    var image = createImage(tile)
    image = resize256(image)
    image.getBuffer(Jimp.MIME_PNG, function(err, buffer) {
      if (err) {
        console.log(err)
        res.status(404).end()
      }
      res.set("Content-Type", Jimp.MIME_JPEG)
      res.send(buffer)
    })
  } else {
    res.status(404).end()
  }
}
