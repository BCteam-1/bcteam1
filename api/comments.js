// api/comments.js
// GET  /api/comments?slug=xyz        -> approved comments for a post, oldest first
// POST /api/comments  { slug, name, email, comment, website(honeypot) }
//      -> inserts as 'pending', sends an email notification, never
//         returns the comment publicly until approved by an admin.

const crypto = require('crypto');
const { supaHeaders, supaUrl, countFromRange } = require('./_lib/supabase');

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT || 'bcteam-default-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function notifyNewComment({ slug, name, email, comment }) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !notifyEmail || !fromEmail) return; // email is optional — fail silently

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: notifyEmail,
        subject: `New comment awaiting approval — ${slug}`,
        html: `
          <p>A new comment was submitted on <strong>${escapeHtml(slug)}</strong>.</p>
          <p><strong>Name:</strong> ${escapeHtml(name)}<br>
          <strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Comment:</strong><br>${escapeHtml(comment)}</p>
          <p><a href="https://www.bcteam1.com/admin/comments">Review in admin panel &rarr;</a></p>
        `,
      }),
    });
  } catch (err) {
    // Never let an email failure block comment submission
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { slug } = req.query;
    if (!slug) {
      res.status(400).json({ error: 'Missing slug' });
      return;
    }
    try {
      const r = await fetch(
        supaUrl(
          `comments?post_slug=eq.${encodeURIComponent(slug)}&status=eq.approved` +
          `&select=id,name,comment_text,created_at&order=created_at.asc`
        ),
        { headers: supaHeaders() }
      );
      const rows = await r.json();
      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
      res.status(200).json({ comments: rows });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load comments' });
    }
    return;
  }

  if (req.method === 'POST') {
    const { slug, name, email, comment, website } = req.body || {};

    // Honeypot — real visitors never see or fill this field.
    // Silently "succeed" so bots don't learn their submission was blocked.
    if (website) {
      res.status(200).json({ success: true, status: 'pending' });
      return;
    }

    if (!slug || !name || !email || !comment) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (
      String(name).length > 100 ||
      String(email).length > 200 ||
      String(comment).length > 3000 ||
      String(comment).trim().length < 2
    ) {
      res.status(400).json({ error: 'Input is invalid or too long' });
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address' });
      return;
    }

    const ipHash = hashIp(getClientIp(req));

    // Rate limit: max 5 submissions per IP per hour
    try {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const rlRes = await fetch(
        supaUrl(`comment_rate_limit?ip_hash=eq.${ipHash}&submitted_at=gte.${since}&select=ip_hash`),
        { headers: supaHeaders({ Prefer: 'count=exact' }) }
      );
      const recentCount = countFromRange(rlRes.headers.get('content-range'));
      if (recentCount >= 5) {
        res.status(429).json({ error: 'Too many submissions. Please try again later.' });
        return;
      }
    } catch (err) {
      // fail open — don't block legitimate comments on a rate-limit check error
    }

    try {
      await fetch(supaUrl('comments'), {
        method: 'POST',
        headers: supaHeaders({ Prefer: 'return=minimal' }),
        body: JSON.stringify({
          post_slug: slug,
          name: escapeHtml(String(name).trim()).slice(0, 100),
          email: String(email).trim().slice(0, 200),
          comment_text: escapeHtml(String(comment).trim()).slice(0, 3000),
          status: 'pending',
          ip_hash: ipHash,
        }),
      });

      // Best-effort rate-limit log — don't block the response on this
      fetch(supaUrl('comment_rate_limit'), {
        method: 'POST',
        headers: supaHeaders({ Prefer: 'return=minimal' }),
        body: JSON.stringify({ ip_hash: ipHash }),
      }).catch(() => {});

      // Best-effort email notification — don't block the response on this
      notifyNewComment({ slug, name, email, comment }).catch(() => {});

      res.status(200).json({ success: true, status: 'pending' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit comment' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
