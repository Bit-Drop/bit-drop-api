const _ = require('lodash')
const moment = require('moment')
const { hexToRgb } = require('../../utils/Utils')

const MAX_ZOOM = 16
const HEX_OPACITY = 160

function calcTileXY(lat, lon) { 
  return {
    x: Math.floor(( lon + 180) / 360 * Math.pow(2, MAX_ZOOM)),
    y: Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, MAX_ZOOM))
  }
}

function setDbTile(db, z, x, y, data, cb) {
  const id = `${z}-${x}-${y}`
  const data_type = 'color'
  const now = moment.utc().format('YYYY-MM-DD HH:mm:ss')
  db.query(`
    INSERT INTO tiles (id, z, x, y, data_type, data, last_change, "user", is_cached)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id)
    DO UPDATE SET (data_type, data, last_change, "user", is_cached) = ($5, $6, $7, $8, $9)
    WHERE tiles.id=$1;
    `, [id, z, x, y, data_type, JSON.stringify(data), now, null, false], (err, result) => {
    if (err) {
      console.error(err)
      return cb(err)
    } else {
      return cb(null)
    }
  })
}

function checkRequiredFields(req) {
  const errors = []
  if (!_.has(req.body, 'lon')) {
    errors.push('Missing parameter: lon')
  }
  if (!_.has(req.body, 'lat')) {
    errors.push('Missing parameter: lat')
  }
  if (!_.has(req.body, 'color')) {
    errors.push('Missing parameter: color')
  }
  return errors
}

module.exports = function(db, req, res) {
  console.log('SET', req.body)
  const errors = checkRequiredFields(req)
  if (errors.length > 0) {
    res.json({ success: false, errors: errors })
    return
  }

  const coords = calcTileXY(req.body.lat, req.body.lon)
  const rgb = hexToRgb(req.body.color)
  const data = [rgb.r, rgb.g, rgb.b, HEX_OPACITY]

  setDbTile(db, MAX_ZOOM, coords.x, coords.y, data, function(err) {
    res.json({ success: err ? false : true })
  })
}
