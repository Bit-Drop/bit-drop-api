const moment = require('moment')

module.exports = function(db, z, x, y, data_type, data, user, is_cached, cb) {
  const id = `${z}-${x}-${y}`
  const now = moment.utc().format('YYYY-MM-DD HH:mm:ss')
  db.query(`
    INSERT INTO tiles (id, z, x, y, data_type, data, last_change, "user", is_cached)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id)
    DO UPDATE SET (data_type, data, last_change, "user", is_cached) = ($5, $6, $7, $8, $9)
    WHERE tiles.id=$1;
    `, [id, z, x, y, data_type, JSON.stringify(data), now, user, is_cached], (err, result) => {
    if (err) {
      console.error(err)
      return cb(err)
    } else {
      return cb(null)
    }
  })
}
