// api/contact.js
// POST { name, email, message, website(honeypot) }
//   -> validates and emails the question to the shared sales inbox via Resend.
// Env: RESEND_API_KEY, RESEND_FROM_EMAIL (already used by api/leads.js)
//      SALES_EMAIL (optional, defaults to sales@bcteam1.com)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_SALES_EMAIL = 'sales@bcteam1.com';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 200);
  const message = String(body.message || '').trim().slice(0, 4000);

  // Honeypot: bots fill the hidden field. Pretend success.
  if (body.website) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!name || !message || !EMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: 'Please provide your name, a valid email and a message.' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    res.status(503).json({ error: 'Email delivery is not configured.' });
    return;
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: process.env.SALES_EMAIL || DEFAULT_SALES_EMAIL,
        reply_to: email,
        subject: `Website question from ${name.replace(/[\r\n]+/g, ' ')}`,
        html: `
          <p>New question from the booking page ("Have a question first?").</p>
          <p><strong>Name:</strong> ${escapeHtml(name)}<br>
          <strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `,
      }),
    });
    if (!r.ok) throw new Error('Resend ' + r.status);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Could not send your message. Please email us directly.' });
  }
};

function safeParse(s) {
  try { return JSON.parse(s); } catch (_) { return {}; }
}
