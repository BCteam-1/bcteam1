"""
bulk_import_blogs.py
====================
Converts a JSON manifest of blog posts into fully-formatted HTML files
ready for immediate publishing via publish_scheduled_blogs.py.

Usage
-----
1. Fill in  scripts/blog-import.json  (see the template below or the
   HOWTO in README). Each entry needs:
     - date         YYYY-MM-DD
     - title        Full post title
     - desc         One-sentence teaser (shown on blog listing)
     - slug         URL slug  e.g. "erp-rescue-checklist-2026"
     - cover_url    Optional image URL (will be downloaded) OR leave blank
     - body         The full article HTML (everything inside .post-body)

2. Run from repo root:
       python scripts/bulk_import_blogs.py

3. Each post lands in pages/scheduled/ with the correct meta comments
   and full HTML structure.

4. Run publish_scheduled_blogs.py to move them to pages/blog/ and add
   cards to blog.html — or set publish-date to today to publish immediately.

Body HTML rules
---------------
- Use <h2> for main section headings, <h3> for sub-headings
- Use <p> for body paragraphs
- Use <hr> for section dividers
- Do NOT include <html>, <head>, <body>, or <article> tags — body content only
- Escape any double quotes inside JSON strings as \"
- Use \\n for newlines inside the JSON body string, or use a multi-line
  JSON editor / the provided template format
"""

import json, os, re, urllib.request, shutil
from pathlib import Path
from datetime import date as dt_date

REPO_ROOT     = Path(__file__).parent.parent
SCHEDULED_DIR = REPO_ROOT / "pages" / "scheduled"
SCHED_IMG_DIR = REPO_ROOT / "assets" / "scheduled"
MANIFEST      = REPO_ROOT / "scripts" / "blog-import.json"

SCHEDULED_DIR.mkdir(parents=True, exist_ok=True)
SCHED_IMG_DIR.mkdir(parents=True, exist_ok=True)

MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

def human_date(iso):
    y, m, d = iso.split("-")
    return f"{MONTHS[int(m)-1]} {int(d)}, {y}"

def slug_from_title(title):
    s = title.lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s[:80]

def download_cover(url, slug, ext=".png"):
    dest = SCHED_IMG_DIR / f"{slug}-cover{ext}"
    if dest.exists():
        return f"/assets/blog/{slug}-cover{ext}"
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"    ↓ downloaded cover → assets/scheduled/{slug}-cover{ext}")
        return f"/assets/blog/{slug}-cover{ext}"
    except Exception as e:
        print(f"    ⚠ could not download cover: {e}")
        return ""

def build_html(post):
    pub_date   = post["date"]          # YYYY-MM-DD
    title      = post["title"]
    desc       = post["desc"]
    slug       = post.get("slug") or slug_from_title(title)
    body_html  = post["body"]
    cover_src  = post.get("cover_url", "")
    cover_path = ""

    # Ensure slug is date-prefixed
    if not slug.startswith(pub_date):
        slug = f"{pub_date}-{slug}"

    # Download cover if URL provided
    if cover_src and cover_src.startswith("http"):
        ext = os.path.splitext(cover_src.split("?")[0])[1] or ".png"
        cover_path = download_cover(cover_src, slug, ext)
    elif cover_src and cover_src.startswith("/"):
        cover_path = cover_src  # already a local path

    canonical = f"https://www.bcteam1.com/pages/blog/{slug}.html"
    og_image  = f"https://www.bcteam1.com{cover_path}" if cover_path else ""
    hdate     = human_date(pub_date)

    cover_img_tag = (
        f'<img src="{cover_path}" '
        f'alt="{title}" '
        f'style="width:100%;border-radius:12px;max-height:420px;object-fit:cover;display:block;" '
        f'loading="lazy">'
        if cover_path else ""
    )
    cover_section = (
        f'\n  <div style="max-width:860px;margin:0 auto 40px;padding:0 24px;">\n'
        f'    {cover_img_tag}\n'
        f'  </div>\n'
        if cover_path else ""
    )

    og_image_tag = (
        f'  <meta property="og:image" content="{og_image}">\n'
        if og_image else ""
    )

    html = f"""<!-- publish-date: {pub_date} -->
<!-- blog-title: {title} -->
<!-- blog-desc: {desc} -->
<!-- blog-cover: {cover_path} -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} | BC Team</title>
  <meta name="description" content="{desc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{canonical}">
  <link rel="icon" type="image/x-icon" href="/assets/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{canonical}">
  <meta property="og:title" content="{title} | BC Team">
  <meta property="og:description" content="{desc}">
{og_image_tag}  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&family=Lato:wght@300;400;700&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&family=Lato:wght@300;400;700&display=swap"></noscript>
  <link rel="stylesheet" href="/style.css">
  <style>
    .post-body h2 {{ font-family:'Nunito Sans',sans-serif; font-weight:900; font-size:22px; color:var(--gray-dark); margin:40px 0 14px; }}
    .post-body h3 {{ font-family:'Nunito Sans',sans-serif; font-weight:800; font-size:17px; color:var(--gray-dark); margin:28px 0 10px; }}
    .post-body p  {{ font-size:16px; color:#333; line-height:1.85; margin-bottom:20px; }}
    .post-body hr {{ border:none; border-top:1px solid var(--gray-border); margin:40px 0; }}
  </style>

  <!-- Schema: Article -->
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{title}",
    "description": "{desc}",
    "datePublished": "{pub_date}",
    "dateModified": "{pub_date}",
    "author": {{
      "@type": "Person",
      "name": "Taylor McEachnie",
      "url": "https://www.bcteam1.com/pages/about.html"
    }},
    "publisher": {{
      "@type": "Organization",
      "name": "BC Team",
      "url": "https://www.bcteam1.com",
      "logo": {{
        "@type": "ImageObject",
        "url": "https://www.bcteam1.com/assets/logo-icon.png"
      }}
    }},
    "mainEntityOfPage": {{
      "@type": "WebPage",
      "@id": "{canonical}"
    }}
  }}
  </script>
</head>
<body>

<div class="bc-alert-banner">
  <div class="bc-alert-banner-inner">
    <span class="bc-alert-text">🔥 <strong>Free BC Health Check</strong> — Find out if your Business Central is silently costing you money</span>
    <div class="alert-btns">
      <a href="https://outlook.office.com/book/RAPDemo@bcteam1.com/s/oJIITW3tvU6B_Uprrd6WAA2" target="_blank" rel="noopener" class="alert-btn alert-btn-primary">Book Free 30-Min Call</a>
      <a href="/pages/bc-rescue-audit.html" class="alert-btn alert-btn-outline">See Rescue Audit →</a>
    </div>
  </div>
</div>
<div id="navbar-placeholder"></div>
<main>

  <article>
    <section style="background:var(--black);padding:56px 24px 48px;">
      <div style="max-width:760px;margin:0 auto;">
        <div class="breadcrumb" style="margin-bottom:20px;">
          <a href="/index.html" style="color:rgba(255,255,255,0.4);">Home</a>
          <span class="breadcrumb-sep" style="color:rgba(255,255,255,0.25);">›</span>
          <a href="/pages/blog.html" style="color:rgba(255,255,255,0.4);">Blog</a>
          <span class="breadcrumb-sep" style="color:rgba(255,255,255,0.25);">›</span>
          <span style="color:rgba(255,255,255,0.6);">{title[:50]}{'...' if len(title)>50 else ''}</span>
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:14px;font-family:'Nunito Sans',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:1px;">{hdate}</div>
        <h1 style="color:#fff;font-size:clamp(24px,3.5vw,44px);line-height:1.2;font-family:'Nunito Sans',sans-serif;font-weight:900;margin-bottom:20px;">{title}</h1>
        <p style="color:rgba(255,255,255,0.65);font-size:17px;line-height:1.7;max-width:660px;">{desc}</p>
      </div>
    </section>
{cover_section}
    <section style="padding:48px 24px 64px;background:#fff;">
      <div style="max-width:760px;margin:0 auto;">

        <div class="post-body">

{body_html}

        </div>

        <div style="background:var(--black);border-radius:12px;padding:32px;text-align:center;margin:48px 0;">
          <div class="section-label" style="color:rgba(255,255,255,0.4);margin-bottom:8px;">Work With BC Team</div>
          <h3 style="color:#fff;font-size:22px;font-weight:900;font-family:'Nunito Sans',sans-serif;margin-bottom:12px;">Talk to someone who's done this before.</h3>
          <p style="color:rgba(255,255,255,0.6);font-size:15px;margin-bottom:24px;line-height:1.6;">Book a free 30-minute call with Taylor. No sales pitch — just an honest look at your BC environment.</p>
          <a href="https://outlook.office.com/book/RAPDemo@bcteam1.com/s/oJIITW3tvU6B_Uprrd6WAA2" target="_blank" rel="noopener" class="btn btn-primary">Book a Free 30-Min Call</a>
        </div>

        <div style="margin-top:40px;padding-top:28px;border-top:1px solid var(--gray-border);text-align:center;">
          <a href="/pages/blog.html" style="font-family:'Nunito Sans',sans-serif;font-weight:800;font-size:14px;color:var(--red);">← Back to all articles</a>
        </div>

      </div>
    </section>
  </article>

</main>
<div id="footer-placeholder"></div>
<script src="/components.js"></script>
<script>renderNavbar("blog"); renderFooter();</script>
</body>
</html>"""

    return slug, html


def main():
    if not MANIFEST.exists():
        print(f"❌ Manifest not found: {MANIFEST}")
        print("   Create scripts/blog-import.json using the template.")
        return

    with open(MANIFEST, encoding="utf-8") as f:
        posts = json.load(f)

    print(f"Found {len(posts)} posts in manifest\n")
    created = []

    for i, post in enumerate(posts, 1):
        title = post.get("title", f"Post {i}")
        date  = post.get("date", "")
        if not date:
            print(f"  ⚠  Post {i} '{title[:50]}' — missing date, skipping")
            continue
        if not post.get("body", "").strip():
            print(f"  ⚠  Post {i} '{title[:50]}' — missing body, skipping")
            continue

        slug, html = build_html(post)
        out_path = SCHEDULED_DIR / f"{slug}.html"
        out_path.write_text(html, encoding="utf-8")
        created.append((date, slug))
        print(f"  ✅ [{date}] {title[:65]}")
        print(f"      → pages/scheduled/{slug}.html")

    print(f"\n{'─'*60}")
    print(f"Created {len(created)} files in pages/scheduled/")
    print()
    print("Next step:")
    print("  python scripts/publish_scheduled_blogs.py")
    print("  (publishes all posts whose date <= today)")


if __name__ == "__main__":
    main()
