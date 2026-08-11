/* ==========================================================
   BC Team Blog — Engagement Widget
   Handles: view counting, likes, comment display/submission
   on individual post pages, and stat badges on the blog list.
   No markup changes needed in existing post files beyond
   including this script — it self-injects everything.
   ========================================================== */
(function () {
  'use strict';

  // ---------- Visitor identity (no login, no PII) ----------
  function getVisitorId() {
    var key = 'bc_visitor_id';
    var id = localStorage.getItem(key);
    if (!id) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
      localStorage.setItem(key, id);
    }
    return id;
  }

  function slugFromPath(pathname) {
    var parts = pathname.split('/').filter(Boolean);
    var last = parts[parts.length - 1] || '';
    return last.replace(/\.html$/, '');
  }

  // ---------- Icons (minimal outline style) ----------
  var ICON_EYE =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>';
  var ICON_HEART =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  var ICON_HEART_FILLED =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  var ICON_COMMENT =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5c-1.35 0-2.63-.31-3.75-.86L3 21l1.86-5.75A8.38 8.38 0 0 1 21 11.5Z"/></svg>';

  function fmt(n) {
    n = n || 0;
    if (n < 1000) return String(n);
    if (n < 1000000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0) + 'k';
    return (n / 1000000).toFixed(1) + 'm';
  }

  // ---------- Shared styles (injected once) ----------
  function injectStyles() {
    if (document.getElementById('bc-engagement-styles')) return;
    var css =
      '.bc-stats-row{display:flex;align-items:center;gap:16px;font-family:"Nunito Sans",sans-serif;font-size:13px;color:#8a8f98;margin-top:8px}' +
      '.bc-stats-row.bc-stats-header{color:rgba(255,255,255,0.55);margin:10px 0 0}' +
      '.bc-stat{display:inline-flex;align-items:center;gap:5px}' +
      '.bc-stat svg{flex-shrink:0;opacity:0.85}' +
      '.bc-like-btn{display:inline-flex;align-items:center;gap:6px;background:none;border:1px solid var(--gray-border,#e2e2e2);border-radius:20px;padding:6px 14px;font-family:"Nunito Sans",sans-serif;font-weight:700;font-size:13px;color:#555;cursor:pointer;transition:all .15s ease}' +
      '.bc-like-btn:hover{border-color:var(--red,#e53e1e);color:var(--red,#e53e1e)}' +
      '.bc-like-btn.liked{background:var(--red,#e53e1e);border-color:var(--red,#e53e1e);color:#fff}' +
      '.bc-like-btn:disabled{cursor:default}' +
      '.bc-post-stats-bar{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin:18px 0 0;padding-top:0}' +
      '.bc-comments-section{max-width:760px;margin:56px auto 0;padding-top:40px;border-top:1px solid var(--gray-border,#e2e2e2)}' +
      '.bc-comments-section h3{font-family:"Nunito Sans",sans-serif;font-weight:900;font-size:20px;color:var(--gray-dark,#1a1a1a);margin:0 0 24px}' +
      '.bc-comment-list{display:flex;flex-direction:column;gap:18px;margin-bottom:36px}' +
      '.bc-comment{border:1px solid var(--gray-border,#e2e2e2);border-radius:10px;padding:16px 18px}' +
      '.bc-comment-meta{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}' +
      '.bc-comment-name{font-family:"Nunito Sans",sans-serif;font-weight:800;font-size:14px;color:var(--gray-dark,#1a1a1a)}' +
      '.bc-comment-date{font-size:12px;color:#999}' +
      '.bc-comment-text{font-size:14.5px;line-height:1.65;color:#333;white-space:pre-wrap;word-wrap:break-word}' +
      '.bc-comment-empty{font-size:14px;color:#999;font-style:italic;margin-bottom:36px}' +
      '.bc-comment-form{display:flex;flex-direction:column;gap:14px}' +
      '.bc-comment-form-row{display:flex;gap:14px;flex-wrap:wrap}' +
      '.bc-comment-form-row > div{flex:1;min-width:200px}' +
      '.bc-comment-form label{display:block;font-family:"Nunito Sans",sans-serif;font-weight:700;font-size:13px;color:var(--gray-dark,#1a1a1a);margin-bottom:6px}' +
      '.bc-comment-form input, .bc-comment-form textarea{width:100%;box-sizing:border-box;border:1px solid var(--gray-border,#e2e2e2);border-radius:8px;padding:11px 13px;font-family:Lato,sans-serif;font-size:14.5px;color:#222;background:#fff}' +
      '.bc-comment-form input:focus, .bc-comment-form textarea:focus{outline:none;border-color:var(--red,#e53e1e)}' +
      '.bc-comment-form textarea{resize:vertical;min-height:100px}' +
      '.bc-hp-field{position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;width:0;overflow:hidden}' +
      '.bc-comment-submit{align-self:flex-start;background:var(--red,#e53e1e);color:#fff;border:none;border-radius:8px;padding:12px 26px;font-family:"Nunito Sans",sans-serif;font-weight:800;font-size:14px;cursor:pointer;transition:opacity .15s}' +
      '.bc-comment-submit:hover{opacity:0.88}' +
      '.bc-comment-submit:disabled{opacity:0.5;cursor:default}' +
      '.bc-comment-note{font-size:12.5px;color:#999;margin-top:-4px}' +
      '.bc-comment-success{background:#eef8f0;border:1px solid #bfe3c6;border-radius:8px;padding:16px 18px;font-size:14.5px;color:#2e6b3e;font-family:Lato,sans-serif}' +
      '.bc-comment-error{background:#fdeeee;border:1px solid #f3c2c2;border-radius:8px;padding:12px 16px;font-size:13.5px;color:#b02a2a;margin-top:-4px}';
    var style = document.createElement('style');
    style.id = 'bc-engagement-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  // ===================================================================
  // MODE 1: Blog listing page — inject small stat rows into each card
  // ===================================================================
  function initListPage() {
    var cards = document.querySelectorAll('.blog-card');
    if (!cards.length) return;

    var slugMap = {};
    cards.forEach(function (card) {
      var link = card.querySelector('a[href*="/pages/blog/"]');
      if (!link) return;
      var href = link.getAttribute('href');
      var slug = slugFromPath(href);
      slugMap[slug] = card;
    });

    var slugs = Object.keys(slugMap);
    if (!slugs.length) return;

    fetch('/api/stats?slugs=' + encodeURIComponent(slugs.join(',')))
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (data) {
        slugs.forEach(function (slug) {
          var stats = data[slug] || { views: 0, likes: 0, comments: 0 };
          var card = slugMap[slug];
          var body = card.querySelector('.blog-card-body');
          if (!body) return;
          var row = el(
            '<div class="bc-stats-row">' +
              '<span class="bc-stat">' + ICON_EYE + '<span>' + fmt(stats.views) + '</span></span>' +
              '<span class="bc-stat">' + ICON_HEART + '<span>' + fmt(stats.likes) + '</span></span>' +
              '<span class="bc-stat">' + ICON_COMMENT + '<span>' + fmt(stats.comments) + '</span></span>' +
            '</div>'
          );
          body.appendChild(row);
        });
      })
      .catch(function () { /* fail silently — cards still render fine without stats */ });
  }

  // ===================================================================
  // MODE 2: Individual post page — record view, render like button +
  // stats bar near the title, render comments section at the bottom
  // ===================================================================
  function initPostPage() {
    var slug = slugFromPath(window.location.pathname);
    if (!slug) return;
    var visitorId = getVisitorId();

    recordView(slug, visitorId);
    renderStatsBar(slug, visitorId);
    renderCommentsSection(slug);
  }

  function recordView(slug, visitorId) {
    var viewedKey = 'bc_viewed_' + slug;
    if (localStorage.getItem(viewedKey)) return;
    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, visitorId: visitorId }),
    })
      .then(function () { localStorage.setItem(viewedKey, '1'); })
      .catch(function () {});
  }

  function renderStatsBar(slug, visitorId) {
    // Find the hero heading to anchor the stats bar just below the intro paragraph
    var heroSection = document.querySelector('article > section');
    if (!heroSection) return;
    var introP = heroSection.querySelector('p');
    var anchor = introP || heroSection;

    var likedKey = 'bc_liked_' + slug;
    var alreadyLiked = !!localStorage.getItem(likedKey);

    var bar = el(
      '<div class="bc-stats-row bc-stats-header">' +
        '<span class="bc-stat" data-stat="views">' + ICON_EYE + '<span>&hellip;</span></span>' +
        '<span class="bc-stat" data-stat="comments">' + ICON_COMMENT + '<span>&hellip;</span></span>' +
        '<button class="bc-like-btn' + (alreadyLiked ? ' liked' : '') + '" data-stat="likes" ' + (alreadyLiked ? 'disabled' : '') + '>' +
          (alreadyLiked ? ICON_HEART_FILLED : ICON_HEART) +
          '<span>&hellip;</span>' +
        '</button>' +
      '</div>'
    );
    anchor.parentNode.insertBefore(bar, anchor.nextSibling);

    fetch('/api/stats?slugs=' + encodeURIComponent(slug))
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (data) {
        var stats = data[slug] || { views: 0, likes: 0, comments: 0 };
        bar.querySelector('[data-stat="views"] span').textContent = fmt(stats.views);
        bar.querySelector('[data-stat="comments"] span').textContent = fmt(stats.comments);
        var likeBtn = bar.querySelector('[data-stat="likes"]');
        likeBtn.querySelector('span').textContent = fmt(stats.likes);
      })
      .catch(function () {});

    var likeBtn = bar.querySelector('.bc-like-btn');
    likeBtn.addEventListener('click', function () {
      if (localStorage.getItem(likedKey)) return;
      likeBtn.disabled = true;
      likeBtn.classList.add('liked');
      likeBtn.innerHTML = ICON_HEART_FILLED + '<span>&hellip;</span>';
      fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug, visitorId: visitorId }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          localStorage.setItem(likedKey, '1');
          likeBtn.innerHTML = ICON_HEART_FILLED + '<span>' + fmt(data.likes) + '</span>';
        })
        .catch(function () {
          likeBtn.disabled = false;
          likeBtn.classList.remove('liked');
          likeBtn.innerHTML = ICON_HEART + '<span>Like</span>';
        });
    });
  }

  function renderCommentsSection(slug) {
    var mainSection = document.querySelector('article section:last-of-type .post-body') ||
                       document.querySelector('article section:last-of-type');
    if (!mainSection) return;

    // Find the "back to all articles" link container to insert comments before it
    var container = mainSection.parentNode;

    var section = el(
      '<div class="bc-comments-section">' +
        '<h3>Comments</h3>' +
        '<div class="bc-comment-list" data-role="comment-list"></div>' +
        '<div class="bc-comment-form-wrap" data-role="form-wrap">' +
          '<form class="bc-comment-form" data-role="comment-form" novalidate>' +
            '<div class="bc-comment-form-row">' +
              '<div><label>Name</label><input type="text" name="name" maxlength="100" required></div>' +
              '<div><label>Email (not shown publicly)</label><input type="email" name="email" maxlength="200" required></div>' +
            '</div>' +
            '<div><label>Comment</label><textarea name="comment" maxlength="3000" required></textarea></div>' +
            '<input class="bc-hp-field" type="text" name="website" tabindex="-1" autocomplete="off">' +
            '<div class="bc-comment-note">Your comment will be reviewed before it appears publicly.</div>' +
            '<div class="bc-comment-error" data-role="error" style="display:none"></div>' +
            '<button type="submit" class="bc-comment-submit" data-role="submit-btn">Submit Comment</button>' +
          '</form>' +
        '</div>' +
      '</div>'
    );

    container.appendChild(section);

    loadComments(slug, section.querySelector('[data-role="comment-list"]'));

    var form = section.querySelector('[data-role="comment-form"]');
    var errorBox = section.querySelector('[data-role="error"]');
    var submitBtn = section.querySelector('[data-role="submit-btn"]');
    var formWrap = section.querySelector('[data-role="form-wrap"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBox.style.display = 'none';

      var name = form.elements['name'].value.trim();
      var email = form.elements['email'].value.trim();
      var comment = form.elements['comment'].value.trim();
      var website = form.elements['website'].value;

      if (!name || !email || !comment) {
        errorBox.textContent = 'Please fill in all fields.';
        errorBox.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug, name: name, email: email, comment: comment, website: website }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (!res.ok) {
            errorBox.textContent = res.data.error || 'Something went wrong. Please try again.';
            errorBox.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Comment';
            return;
          }
          formWrap.innerHTML =
            '<div class="bc-comment-success">Thanks — your comment is awaiting approval and will appear once reviewed.</div>';
        })
        .catch(function () {
          errorBox.textContent = 'Network error. Please try again.';
          errorBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Comment';
        });
    });
  }

  function loadComments(slug, listEl) {
    fetch('/api/comments?slug=' + encodeURIComponent(slug))
      .then(function (r) { return r.ok ? r.json() : { comments: [] }; })
      .then(function (data) {
        var comments = data.comments || [];
        if (!comments.length) {
          listEl.outerHTML = '<div class="bc-comment-empty" data-role="comment-list">Be the first to leave a comment.</div>';
          return;
        }
        listEl.innerHTML = comments
          .map(function (c) {
            var date = new Date(c.created_at);
            var dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            return (
              '<div class="bc-comment">' +
                '<div class="bc-comment-meta"><span class="bc-comment-name">' + escapeHtml(c.name) + '</span>' +
                '<span class="bc-comment-date">' + dateStr + '</span></div>' +
                '<div class="bc-comment-text">' + escapeHtml(c.comment_text) + '</div>' +
              '</div>'
            );
          })
          .join('');
      })
      .catch(function () {});
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Boot ----------
  function init() {
    injectStyles();
    var path = window.location.pathname;
    if (path === '/pages/blog.html' || path === '/pages/blog' || path === '/pages/blog/') {
      initListPage();
    } else if (path.indexOf('/pages/blog/') === 0 && path.length > '/pages/blog/'.length) {
      initPostPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
