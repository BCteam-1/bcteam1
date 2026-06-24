# Scheduled Blog Posts

Drop your blog HTML files here before they go live.

## File naming
```
pages/scheduled/YYYY-MM-DD-my-post-slug.html
assets/scheduled/YYYY-MM-DD-my-post-slug-cover.png   (optional cover image)
```

## Required meta comments (paste inside `<head>` of each HTML file)
```html
<!-- publish-date: 2026-07-04 -->
<!-- blog-title: My Post Title Here -->
<!-- blog-desc: One sentence teaser shown on the blog listing page. -->
<!-- blog-cover: /assets/blog/2026-07-04-my-post-slug-cover.png -->
```

## How it works
- A GitHub Action runs **daily at midnight UTC (8am Manila time)**
- Any post whose `publish-date` is today or earlier gets automatically:
  1. Moved to `pages/blog/`
  2. Cover image moved from `assets/scheduled/` to `assets/blog/`
  3. A new card injected at the top of `pages/blog.html`
  4. Vercel deploys the live site automatically

## Trigger manually
Go to GitHub -> Actions -> Publish Scheduled Blogs -> Run workflow
to publish immediately without waiting for the daily schedule.
