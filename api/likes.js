// api/likes.js
// POST { slug, visitorId } -> records one like per unique visitor per post.
// Repeat calls from the same visitor are no-ops (primary key on the table).

const { supaHeaders, supaUrl, countFromRange } = require('./_lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { slug, visitorId } = req.body || {};
  if (!slug || !visitorId) {
    res.status(400).json({ error: 'Missing slug or visitorId' });
    return;
  }

  try {
    await fetch(supaUrl('post_likes'), {
      method: 'POST',
      headers: supaHeaders({ Prefer: 'resolution=ignore-duplicates,return=minimal' }),
      body: JSON.stringify({ post_slug: slug, visitor_id: visitorId }),
    });

    const countRes = await fetch(
      supaUrl(`post_likes?post_slug=eq.${encodeURIComponent(slug)}&select=post_slug`),
      { headers: supaHeaders({ Prefer: 'count=exact' }) }
    );
    const total = countFromRange(countRes.headers.get('content-range'));

    res.status(200).json({ likes: total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like post' });
  }
};
