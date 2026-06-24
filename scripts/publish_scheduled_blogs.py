"""
publish_scheduled_blogs.py
==========================
Reads every .html file in  pages/scheduled/
that has a  <!-- publish-date: YYYY-MM-DD -->  meta comment.
If the date <= today (UTC), it:
  1. Moves the file to pages/blog/
  2. Moves any matching cover image  assets/scheduled/ -> assets/blog/
  3. Injects a new card at the TOP of the blog listing in pages/blog.html
  4. Deletes the file from pages/scheduled/

File naming convention
----------------------
  pages/scheduled/YYYY-MM-DD-my-post-slug.html
  assets/scheduled/YYYY-MM-DD-my-post-slug-cover.png  (optional)

Required meta comment inside each scheduled HTML file (anywhere in <head>):
  <!-- publish-date: 2026-07-04 -->
  <!-- blog-title: My Post Title -->
  <!-- blog-desc: One sentence teaser shown on the blog list. -->
  <!-- blog-cover: /assets/blog/YYYY-MM-DD-my-post-slug-cover.png -->  (optional)
"""

import os, re, shutil
from datetime import date
from pathlib import Path

TODAY = date.today()
SCHEDULED_DIR = Path("pages/scheduled")
BLOG_DIR      = Path("pages/blog")
SCHED_IMG_DIR = Path("assets/scheduled")
BLOG_IMG_DIR  = Path("assets/blog")
BLOG_LIST     = Path("pages/blog.html")

def extract_meta(html, key):
    m = re.search(rf'<!--\s*{key}:\s*(.+?)\s*-->', html)
    return m.group(1).strip() if m else ""

def build_card(slug, title, desc, cover, pub_date):
    url = f"/pages/blog/{slug}.html"
    date_str = pub_date.strftime("%b %-d, %Y")
    thumb = (
        f'<img class="blog-card-thumb" src="{cover}" alt="{title}" loading="lazy">'
        if cover else
        '<div class="blog-card-thumb-placeholder">&#128196;</div>'
    )
    return (
        f'      <!-- Scheduled Post: {date_str} -->\n'
        f'      <article class="blog-card">\n'
        f'        {thumb}\n'
        f'        <div class="blog-card-body">\n'
        f'          <div class="blog-card-date">{date_str}</div>\n'
        f'          <h2 class="blog-card-title">\n'
        f'            <a href="{url}">{title}</a>\n'
        f'          </h2>\n'
        f'          <p class="blog-card-desc">{desc}</p>\n'
        f'          <a href="{url}" class="blog-card-link">Read article &#8594;</a>\n'
        f'        </div>\n'
        f'      </article>\n'
    )

def inject_card(blog_list_html, card):
    marker = re.search(r'(<div[^>]*class="[^"]*blog-grid[^"]*"[^>]*>)', blog_list_html)
    if marker:
        pos = marker.end()
        return blog_list_html[:pos] + "\n" + card + blog_list_html[pos:]
    return blog_list_html.replace(
        '<article class="blog-card">',
        card + '      <article class="blog-card">',
        1
    )

def update_post_count(html):
    def bump(m):
        return f'Showing {int(m.group(1)) + 1} most recent posts.'
    return re.sub(r'Showing (\d+) most recent posts\.', bump, html)

def main():
    if not SCHEDULED_DIR.exists():
        print("No pages/scheduled/ directory -- nothing to publish.")
        return

    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    BLOG_IMG_DIR.mkdir(parents=True, exist_ok=True)

    blog_list_html = BLOG_LIST.read_text(encoding="utf-8")
    published_count = 0

    for f in sorted(SCHEDULED_DIR.glob("*.html")):
        html = f.read_text(encoding="utf-8")
        pub_date_str = extract_meta(html, "publish-date")
        if not pub_date_str:
            print(f"  SKIP {f.name} -- no publish-date meta")
            continue

        pub_date = date.fromisoformat(pub_date_str)
        if pub_date > TODAY:
            print(f"  SKIP {f.name} -- scheduled for {pub_date} (future)")
            continue

        slug  = f.stem
        title = extract_meta(html, "blog-title") or slug.replace("-", " ").title()
        desc  = extract_meta(html, "blog-desc") or ""
        cover = extract_meta(html, "blog-cover") or ""

        for ext in (".png", ".jpg", ".jpeg", ".webp"):
            src_img = SCHED_IMG_DIR / f"{slug}-cover{ext}"
            if src_img.exists():
                dst_img = BLOG_IMG_DIR / f"{slug}-cover{ext}"
                shutil.move(str(src_img), str(dst_img))
                if not cover:
                    cover = f"/assets/blog/{slug}-cover{ext}"
                print(f"  IMG  {src_img.name} -> assets/blog/")
                break

        dst = BLOG_DIR / f.name
        shutil.move(str(f), str(dst))
        print(f"  PUBLISH {f.name} -> pages/blog/")

        card = build_card(slug, title, desc, cover, pub_date)
        blog_list_html = inject_card(blog_list_html, card)
        blog_list_html = update_post_count(blog_list_html)
        published_count += 1

    if published_count:
        BLOG_LIST.write_text(blog_list_html, encoding="utf-8")
        print(f"\nPublished {published_count} post(s). blog.html updated.")
    else:
        print("\nNo posts due today.")

if __name__ == "__main__":
    main()
