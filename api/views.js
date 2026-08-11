// api/views.js
// POST { slug, visitorId } -> records one view per unique visitor per post.
// Server-side dedup via the (post_slug, visitor_id) primary key means
// even repeated calls never double-count. Bot user-agents are excluded.

const { supaHeaders, supaUrl, countFromRange } = require('./_lib/supabase');

const BOT_PATTERNS = [
  'bot', 'crawl', 'spider', 'slurp', 'facebookexternalhit', 'preview',
  'headless', 'curl', 'wget', 'python-requests', 'go-http-client',
  'vercel-screenshot', 'pingdom', 'uptimerobot', 'lighthouse',
];

function isBot(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  return BOT_PATTERNS.some((p) => ua.includes(p));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (isBot(req.headers['user-agent'])) {
    res.status(200).json({ counted: false, reason: 'bot' });
    return;
  }

  const { slug, visitorId } = req.body || {};
  if (!slug || !visitorId) {
    res.status(400).json({ error: 'Missing slug or visitorId' });
    return;
  }

  try {
    // Insert; ignore if this visitor already has a view row for this post.
    await fetch(supaUrl('post_views'), {
      method: 'POST',
      headers: supaHeaders({ Prefer: 'resolution=ignore-duplicates,return=minimal' }),
      body: JSON.stringify({ post_slug: slug, visitor_id: visitorId }),
    });

    const countRes = await fetch(
      supaUrl(`post_views?post_slug=eq.${encodeURIComponent(slug)}&select=post_slug`),
      { headers: supaHeaders({ Prefer: 'count=exact' }) }
    );
    const total = countFromRange(countRes.headers.get('content-range'));

    res.status(200).json({ views: total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record view' });
  }
};
