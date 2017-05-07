const _ = require('lodash')

module.exports = function(db, req, res) {
  res.json(_.defaults(req.body, { success: true }))
}
