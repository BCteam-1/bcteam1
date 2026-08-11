-- ============================================================
-- BC Team Blog — Engagement Metrics Schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Comments table
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null,
  name text not null,
  email text not null,
  comment_text text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  ip_hash text
);

create index if not exists idx_comments_slug_status on comments (post_slug, status);
create index if not exists idx_comments_status on comments (status);
create index if not exists idx_comments_created on comments (created_at desc);

-- Post views — one row per unique visitor per post (dedup enforced by primary key)
create table if not exists post_views (
  post_slug text not null,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_slug, visitor_id)
);

-- Post likes — one row per unique visitor per post (dedup enforced by primary key)
create table if not exists post_likes (
  post_slug text not null,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_slug, visitor_id)
);

-- Rate limiting for comment submissions (per IP hash)
create table if not exists comment_rate_limit (
  ip_hash text not null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_ip_time on comment_rate_limit (ip_hash, submitted_at);

-- ============================================================
-- Aggregated stats view — used by the blog list page and post pages
-- to fetch views/likes/approved-comment counts in a single query
-- ============================================================
create or replace view post_stats as
select
  s.post_slug,
  coalesce(v.views, 0)    as views,
  coalesce(l.likes, 0)    as likes,
  coalesce(c.comments, 0) as comments
from (
  select post_slug from post_views
  union
  select post_slug from post_likes
  union
  select post_slug from comments where status = 'approved'
) s
left join (select post_slug, count(*) as views    from post_views group by post_slug) v on v.post_slug = s.post_slug
left join (select post_slug, count(*) as likes    from post_likes group by post_slug) l on l.post_slug = s.post_slug
left join (select post_slug, count(*) as comments from comments where status = 'approved' group by post_slug) c on c.post_slug = s.post_slug;

-- ============================================================
-- Row Level Security — lock everything down.
-- Our serverless functions use the service_role key, which
-- always bypasses RLS, so the public/anon key gets zero access.
-- This means even if a key were ever exposed client-side by mistake,
-- no data could be read or written directly against Supabase.
-- ============================================================
alter table comments enable row level security;
alter table post_views enable row level security;
alter table post_likes enable row level security;
alter table comment_rate_limit enable row level security;

-- No policies are created — default-deny for anon/authenticated roles.
-- service_role (used only in our Vercel serverless functions) bypasses RLS entirely.

-- ============================================================
-- Done. After running this, go to Settings → API in your Supabase
-- project and copy:
--   - Project URL          -> SUPABASE_URL
--   - service_role secret  -> SUPABASE_SERVICE_ROLE_KEY
-- Add both as Environment Variables in your Vercel project settings.
-- ============================================================
