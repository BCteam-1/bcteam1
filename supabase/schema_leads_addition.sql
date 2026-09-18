-- ============================================================
-- BC Team Blog — Lead Magnet Schema Addition
-- Run this once in the Supabase SQL Editor, AFTER the original
-- supabase/schema.sql has already been run.
-- ============================================================

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  lead_magnet text not null,       -- e.g. 'bc-optimization', 'bc-implementation', 'erp-rescue', 'rap'
  post_slug text not null,          -- which blog post the download came from
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_email on leads (email);
create index if not exists idx_leads_magnet on leads (lead_magnet);
create index if not exists idx_leads_created on leads (created_at desc);

-- Rate limiting for lead form submissions (reuses same pattern as comments)
create table if not exists lead_rate_limit (
  ip_hash text not null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_lead_rate_limit_ip_time on lead_rate_limit (ip_hash, submitted_at);

-- ============================================================
-- Row Level Security — same pattern as the rest of the schema.
-- Only the service_role key (used server-side in Vercel functions)
-- can read or write this table. No public policies are created.
-- ============================================================
alter table leads enable row level security;
alter table lead_rate_limit enable row level security;

-- ============================================================
-- Done. No new environment variables needed — this reuses the
-- existing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY already
-- configured in Vercel for the comments/views/likes system.
-- ============================================================
