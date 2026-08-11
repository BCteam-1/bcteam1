// api/admin/moderate.js
// POST { id, action: 'approve' | 'reject' } -> updates comment status.
// Rejected comments are soft-deleted (status flag only) — never erased.

const { verifyAdmin } = require('../_lib/verifyAdmin');
const { supaHeaders, supaUrl } = require('../_lib/supabase');

module.exports = async (req, res) => {
  if (!verifyAdmin(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { id, action } = req.body || {};
  if (!id || !['approve', 'reject'].includes(action)) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const status = action === 'approve' ? 'approved' : 'rejected';

  try {
    const r = await fetch(supaUrl(`comments?id=eq.${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: supaHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ status }),
    });
    if (!r.ok) {
      res.status(500).json({ error: 'Failed to update comment' });
      return;
    }
    res.status(200).json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update comment' });
  }
};
