// api/_lib/verifyAdmin.js
// Shared helper — files/folders prefixed with "_" are excluded from
// Vercel's automatic API routing, so this is safe to import without
// becoming its own public endpoint.

const crypto = require('crypto');

function sign(value, secret) {
  const h = crypto.createHmac('sha256', secret).update(value).digest('hex');
  return `${value}.${h}`;
}

function verifyAdmin(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/bc_admin=([^;]+)/);
  if (!match) return false;

  const token = decodeURIComponent(match[1]);
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [value, sig] = parts;

  const secret = process.env.ADMIN_SESSION_SECRET || 'change-me-in-vercel-env';
  const expected = crypto.createHmac('sha256', secret).update(value).digest('hex');

  // Constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return value === 'authenticated' && crypto.timingSafeEqual(a, b);
}

module.exports = { verifyAdmin, sign };
