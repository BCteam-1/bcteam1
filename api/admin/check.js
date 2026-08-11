// api/admin/check.js
const { verifyAdmin } = require('../_lib/verifyAdmin');

module.exports = (req, res) => {
  res.status(200).json({ authenticated: verifyAdmin(req) });
};
