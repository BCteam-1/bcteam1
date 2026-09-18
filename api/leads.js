// api/leads.js
// POST { email, name, leadMagnet, postSlug, website(honeypot) }
//   -> validates, rate-limits, stores the lead in Supabase,
//      emails the requested PDF as a download link via Resend,
//      and returns a direct download URL so the page can also
//      unlock the button immediately (belt-and-suspenders delivery).

const crypto = require('crypto');
const { supaHeaders, supaUrl, countFromRange } = require('./_lib/supabase');

// Maps a lead magnet key to its static PDF path and display name.
// The PDF files themselves live in /assets/leadmagnets/ as public,
// static files — "gating" happens by only revealing/emailing the
// link after a valid submission, not by restricting file access.
const LEAD_MAGNETS = {
  'bc-optimization': {
    file: '/assets/leadmagnets/bc-optimization-health-check-checklist.pdf',
    title: 'The Business Central Health Check Checklist',
  },
  'bc-implementation': {
    file: '/assets/leadmagnets/bc-implementation-readiness-checklist.pdf',
    title: 'The Business Central Implementation Readiness Checklist',
  },
  'erp-rescue': {
    file: '/assets/leadmagnets/erp-rescue-warning-signs-checklist.pdf',
    title: 'ERP Rescue: 10 Warning Signs Your BC Project Needs Stabilization',
  },
  'rap': {
    file: '/assets/leadmagnets/rap-ar-automation-cost-calculator-guide.pdf',
    title: 'The Real Cost of Manual AR Follow-Up',
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

async function sendLeadMagnetEmail({ email, name, magnet, downloadUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return; // optional — form still works without email delivery

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: `Your download: ${magnet.title}`,
        html: `
          <p>Hi${name ? ' ' + escapeHtml(name) : ''},</p>
          <p>Here's your copy of <strong>${escapeHtml(magnet.title)}</strong>:</p>
          <p><a href="${downloadUrl}">${downloadUrl}</a></p>
          <p>If you have questions about anything in it, we're happy to talk it through —
          <a href="https://outlook.office.com/book/RAPDemo@bcteam1.com/s/oJIITW3tvU6B_Uprrd6WAA2">book a free 30-minute call</a>.</p>
          <p>— The BC Team</p>
        `,
      }),
    });
  } catch (err) {
    // never block the response on an email failure
  }
}

async function notifyTeamOfNewLead({ email, name, leadMagnet, postSlug }) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !notifyEmail || !fromEmail) return;

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
        subject: `New lead: ${leadMagnet} (${escapeHtml(email)})`,
        html: `
          <p>New lead magnet download.</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}<br>
          <strong>Name:</strong> ${escapeHtml(name || '(not provided)')}<br>
          <strong>Lead magnet:</strong> ${escapeHtml(leadMagnet)}<br>
          <strong>From post:</strong> ${escapeHtml(postSlug)}</p>
        `,
      }),
    });
  } catch (err) {
    // best-effort only
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { email, name, leadMagnet, postSlug, website } = req.body || {};

  // Honeypot — silently "succeed" so bots don't learn their submission was blocked
  if (website) {
    res.status(200).json({ success: true });
    return;
  }

  if (!email || !leadMagnet || !postSlug) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  if (!EMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address' });
    return;
  }
  const magnet = LEAD_MAGNETS[leadMagnet];
  if (!magnet) {
    res.status(400).json({ error: 'Unknown resource requested' });
    return;
  }

  const ipHash = hashIp(getClientIp(req));

  // Rate limit: max 5 submissions per IP per hour (same pattern as comments)
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const rlRes = await fetch(
      supaUrl(`lead_rate_limit?ip_hash=eq.${ipHash}&submitted_at=gte.${since}&select=ip_hash`),
      { headers: supaHeaders({ Prefer: 'count=exact' }) }
    );
    const recentCount = countFromRange(rlRes.headers.get('content-range'));
    if (recentCount >= 5) {
      res.status(429).json({ error: 'Too many submissions. Please try again later.' });
      return;
    }
  } catch (err) {
    // fail open
  }

  try {
    await fetch(supaUrl('leads'), {
      method: 'POST',
      headers: supaHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify({
        email: String(email).trim().slice(0, 200),
        name: name ? escapeHtml(String(name).trim()).slice(0, 100) : null,
        lead_magnet: leadMagnet,
        post_slug: postSlug,
        ip_hash: ipHash,
      }),
    });

    fetch(supaUrl('lead_rate_limit'), {
      method: 'POST',
      headers: supaHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ ip_hash: ipHash }),
    }).catch(() => {});

    const downloadUrl = `https://www.bcteam1.com${magnet.file}`;

    sendLeadMagnetEmail({ email, name, magnet, downloadUrl }).catch(() => {});
    notifyTeamOfNewLead({ email, name, leadMagnet, postSlug }).catch(() => {});

    res.status(200).json({ success: true, downloadUrl, title: magnet.title });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request' });
  }
};
