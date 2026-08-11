// api/stats.js
// GET /api/stats?slugs=slug-a,slug-b,slug-c
// Returns { "slug-a": { views, likes, comments }, ... } in a single query
// via the post_stats view defined in supabase/schema.sql.

const { supaHeaders, supaUrl } = require('./_lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { slugs } = req.query;
  if (!slugs) {
    res.status(400).json({ error: 'Missing slugs query param' });
    return;
  }

  const slugList = String(slugs)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100); // sanity cap

  if (slugList.length === 0) {
    res.status(200).json({});
    return;
  }

  const inList = slugList.map((s) => `"${s.replace(/"/g, '')}"`).join(',');

  try {
    const r = await fetch(
      supaUrl(`post_stats?post_slug=in.(${inList})&select=post_slug,views,likes,comments`),
      { headers: supaHeaders() }
    );
    const rows = await r.json();

    const result = {};
    for (const slug of slugList) {
      result[slug] = { views: 0, likes: 0, comments: 0 };
    }
    for (const row of rows) {
      result[row.post_slug] = {
        views: row.views || 0,
        likes: row.likes || 0,
        comments: row.comments || 0,
      };
    }

    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
