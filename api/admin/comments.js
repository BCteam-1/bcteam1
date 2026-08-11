// api/admin/comments.js
// GET -> list of pending comments (auth required)

const { verifyAdmin } = require('../_lib/verifyAdmin');
const { supaHeaders, supaUrl } = require('../_lib/supabase');

module.exports = async (req, res) => {
  if (!verifyAdmin(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const r = await fetch(
      supaUrl(
        'comments?status=eq.pending' +
        '&select=id,post_slug,name,email,comment_text,created_at&order=created_at.desc'
      ),
      { headers: supaHeaders() }
    );
    const rows = await r.json();
    res.status(200).json({ comments: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load comments' });
  }
};
