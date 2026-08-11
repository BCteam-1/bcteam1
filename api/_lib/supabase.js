// api/_lib/supabase.js
// Thin wrapper around Supabase's auto-generated REST (PostgREST) API.
// No SDK/npm dependency required — plain fetch calls.

function supaHeaders(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function supaUrl(path) {
  const base = process.env.SUPABASE_URL;
  if (!base) throw new Error('SUPABASE_URL is not set');
  return `${base}/rest/v1/${path}`;
}

// Returns the total row count from a Supabase content-range response header
// e.g. "0-9/42" -> 42
function countFromRange(headerValue) {
  if (!headerValue) return 0;
  const parts = headerValue.split('/');
  const total = parseInt(parts[1], 10);
  return Number.isFinite(total) ? total : 0;
}

module.exports = { supaHeaders, supaUrl, countFromRange };
