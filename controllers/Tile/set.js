const _ = require('lodash')
const moment = require('moment')
const upsertDb = require('./upsertDb')
const { hexToRgb } = require('../../utils/Utils')

const MAX_ZOOM = process.env.MAX_ZOOM
const HEX_OPACITY = 160

function calcTileXY(lat, lon) { 
  return {
    x: Math.floor(( lon + 180) / 360 * Math.pow(2, MAX_ZOOM)),
    y: Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, MAX_ZOOM))
  }
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

  upsertDb(db, MAX_ZOOM, coords.x, coords.y, 'color', data, null, false, function(err) {
    res.json({ success: err ? false : true })
  })
}
