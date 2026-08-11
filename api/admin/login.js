// api/admin/login.js
// POST { password } -> sets an httpOnly, signed session cookie if the
// password matches ADMIN_PASSWORD. Single shared password, no accounts.

const { sign } = require('../_lib/verifyAdmin');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { password } = req.body || {};
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const SECRET = process.env.ADMIN_SESSION_SECRET || 'change-me-in-vercel-env';

  if (!ADMIN_PASSWORD) {
    res.status(500).json({ error: 'Admin password is not configured on the server' });
    return;
  }

  if (!password || password !== ADMIN_PASSWORD) {
    // Small delay to slow down brute-force attempts
    setTimeout(() => {
      res.status(401).json({ error: 'Incorrect password' });
    }, 400);
    return;
  }

  const token = sign('authenticated', SECRET);
  const eightHours = 60 * 60 * 8;
  res.setHeader(
    'Set-Cookie',
    `bc_admin=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${eightHours}`
  );
  res.status(200).json({ success: true });
};
