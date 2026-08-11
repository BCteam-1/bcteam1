# Blog Engagement Metrics — Setup Guide

This feature is fully coded and pushed to the repo, but it needs three things
configured before it goes live: a Supabase database, Vercel environment
variables, and (optionally) email notifications via Resend.

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → sign up (free tier is enough)
2. Click **New Project** → name it (e.g. `bcteam-blog`) → choose a region close to your users (e.g. US East for Canada/US traffic) → set a database password (save it somewhere safe, you won't need it day-to-day)
3. Wait ~2 minutes for the project to provision

## Step 2 — Run the Database Schema

1. In your Supabase project, click **SQL Editor** in the left sidebar → **New query**
2. Open `supabase/schema.sql` from this repo, copy the entire contents
3. Paste it into the SQL editor and click **Run**
4. You should see "Success. No rows returned" — this created 4 tables and 1 view

## Step 3 — Get Your Supabase API Credentials

1. In Supabase, go to **Settings → API**
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy the **service_role** secret key (⚠️ NOT the `anon` key — the service_role key. Keep this secret, never put it in client-side code)

## Step 4 — (Optional but recommended) Set Up Email Notifications

1. Go to [resend.com](https://resend.com) → sign up (free tier: 3,000 emails/month)
2. Verify a sending domain, or use their test domain for now
3. Create an **API Key** (Settings → API Keys)
4. Note the API key and the "from" email address you want notifications sent from

If you skip this step, comments will still work — you just won't get an email
alert when a new one comes in. You'll need to check `/admin/comments`
periodically instead.

## Step 5 — Add Environment Variables in Vercel

1. Go to your Vercel project → **Settings → Environment Variables**
2. Add each of these (apply to **Production**, **Preview**, and **Development**):

| Variable | Value | Required? |
|---|---|---|
| `SUPABASE_URL` | Your Supabase Project URL | ✅ Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key | ✅ Required |
| `ADMIN_PASSWORD` | A password only you know, for `/admin/comments` | ✅ Required |
| `ADMIN_SESSION_SECRET` | Any long random string (e.g. generate one at [randomkeygen.com](https://randomkeygen.com)) | ✅ Required |
| `IP_HASH_SALT` | Any random string — used to anonymize IPs for rate limiting | Recommended |
| `RESEND_API_KEY` | Your Resend API key | Optional (for email alerts) |
| `NOTIFY_EMAIL` | Where comment alerts should be sent, e.g. `TheBCTeam@bcteam1.com` | Optional |
| `RESEND_FROM_EMAIL` | The verified sending address from Resend | Optional |

3. Click **Save** for each

## Step 6 — Redeploy

1. In Vercel, go to **Deployments** → click the **⋯** menu on the latest deployment → **Redeploy**
   (Environment variable changes require a redeploy to take effect)

## Step 7 — Test It

1. Visit **bcteam1.com/pages/blog** — you should see small view/like/comment icons on each card (starting at 0)
2. Open any blog post — you should see the same stats near the title, plus a comment form at the bottom
3. Submit a test comment
4. Go to **bcteam1.com/admin/comments**, log in with your `ADMIN_PASSWORD`, and approve or reject it
5. Refresh the blog post — approved comments appear publicly; rejected ones stay hidden permanently (but are kept in the database, not deleted)

---

## How It Works (Quick Reference)

- **Views**: counted once per browser via a `localStorage` flag + a database-level unique constraint (visitor + post), so refreshing never inflates the count. Bot user-agents are filtered server-side.
- **Likes**: same dedup approach — one like per visitor per post, no login required, no unlike (by design, matches most blog platforms).
- **Comments**: always start as `pending`. They're invisible on the site until you approve them in `/admin/comments`. Rejected comments are kept in the database with a `rejected` status — never deleted — in case you need to review a dispute later.
- **Spam protection**: a honeypot field (invisible to real visitors, bots often fill it) plus a rate limit of 5 submissions per IP per hour.
- **Admin access**: single shared password stored as `ADMIN_PASSWORD`, no user accounts. Session is a signed, HTTP-only cookie that expires after 8 hours.

## Adding the Widget to New Blog Posts

Every new post you publish needs one line added before `</body>`:

```html
<script src="/assets/engagement.js" defer></script>
```

This has already been added to all existing posts and to `blog.html`. Going
forward, just make sure this script tag is present in any new post's HTML —
it self-injects the stats bar, like button, and comment section with no
other markup changes needed.
