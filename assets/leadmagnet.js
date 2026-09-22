/* ==========================================================
   BC Team Blog — Lead Magnet Widget
   Renders a gated download form wherever a post includes a
   div with data-lead-magnet="bc-optimization" etc. Handles
   submission, unlocks the download immediately on success,
   and matches the site's existing dark-card CTA style.
   ========================================================== */
(function () {
  'use strict';

  function slugFromPath(pathname) {
    var parts = pathname.split('/').filter(Boolean);
    var last = parts[parts.length - 1] || '';
    return last.replace(/\.html$/, '');
  }

  function injectStyles() {
    if (document.getElementById('bc-leadmagnet-styles')) return;
    var css =
      '.bc-lm-card{background:var(--black,#0D1B2A);border-radius:12px;padding:32px;margin:48px 0;color:#fff;font-family:Lato,sans-serif}' +
      '.bc-lm-card .bc-lm-label{font-family:"Nunito Sans",sans-serif;font-weight:800;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:10px}' +
      '.bc-lm-card h3{font-family:"Nunito Sans",sans-serif;font-weight:900;font-size:21px;color:#fff;margin:0 0 10px}' +
      '.bc-lm-card p.bc-lm-desc{color:rgba(255,255,255,0.65);font-size:14.5px;line-height:1.6;margin:0 0 22px}' +
      '.bc-lm-form{display:flex;gap:10px;flex-wrap:wrap}' +
      '.bc-lm-form input[type=email],.bc-lm-form input[type=text]{flex:1;min-width:180px;padding:12px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;font-size:14.5px}' +
      '.bc-lm-form input::placeholder{color:rgba(255,255,255,0.4)}' +
      '.bc-lm-form input:focus{outline:none;border-color:var(--red,#E53E1E)}' +
      '.bc-lm-submit{background:var(--red,#E53E1E);color:#fff;border:none;border-radius:8px;padding:12px 26px;font-family:"Nunito Sans",sans-serif;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap}' +
      '.bc-lm-submit:hover{opacity:0.9}' +
      '.bc-lm-submit:disabled{opacity:0.5;cursor:default}' +
      '.bc-lm-hp{position:absolute;left:-9999px;opacity:0;height:0;width:0}' +
      '.bc-lm-error{color:#ff9b9b;font-size:13px;margin-top:10px}' +
      '.bc-lm-success{background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);border-radius:8px;padding:16px 18px;font-size:14.5px;color:#c8f5d8}' +
      '.bc-lm-success a.bc-lm-download{display:inline-block;margin-top:10px;background:#22c55e;color:#06280f;font-weight:800;text-decoration:none;padding:10px 20px;border-radius:8px;font-family:"Nunito Sans",sans-serif;font-size:13.5px}' +
      '.bc-lm-note{font-size:12px;color:rgba(255,255,255,0.4);margin-top:10px}';
    var style = document.createElement('style');
    style.id = 'bc-leadmagnet-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  var MAGNET_LABELS = {
    'bc-optimization': { label: 'Free Download', title: 'The Business Central Health Check Checklist', desc: '12 things worth checking before you assume your environment just needs a bigger server.' },
    'bc-implementation': { label: 'Free Download', title: 'The Business Central Implementation Readiness Checklist', desc: 'What to have in place before you sign with any implementation partner.' },
    'erp-rescue': { label: 'Free Download', title: 'ERP Rescue: 10 Warning Signs Your BC Project Needs Stabilization', desc: 'How to tell whether your implementation needs a course correction or a full restart.' },
    'rap': { label: 'Free Download', title: 'The Real Cost of Manual AR Follow-Up', desc: 'A simple framework for calculating what manual collections is actually costing your business.' },
  };

  function renderWidget(container) {
    var magnetKey = container.getAttribute('data-lead-magnet');
    var info = MAGNET_LABELS[magnetKey];
    if (!info) return;

    var postSlug = slugFromPath(window.location.pathname);

    var card = el(
      '<div class="bc-lm-card">' +
        '<div class="bc-lm-label">' + info.label + '</div>' +
        '<h3>' + info.title + '</h3>' +
        '<p class="bc-lm-desc">' + info.desc + '</p>' +
        '<form class="bc-lm-form" data-role="lm-form" novalidate>' +
          '<input type="text" name="name" placeholder="First name (optional)" style="max-width:200px">' +
          '<input type="email" name="email" placeholder="Work email" required>' +
          '<input class="bc-lm-hp" type="text" name="website" tabindex="-1" autocomplete="off">' +
          '<button type="submit" class="bc-lm-submit">Get the Free Checklist</button>' +
        '</form>' +
        '<div class="bc-lm-error" data-role="lm-error" style="display:none"></div>' +
        '<div class="bc-lm-note">No spam. Enter your details to unlock the download.</div>' +
      '</div>'
    );

    container.replaceWith(card);

    var form = card.querySelector('[data-role="lm-form"]');
    var errorBox = card.querySelector('[data-role="lm-error"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBox.style.display = 'none';

      var email = form.elements['email'].value.trim();
      var name = form.elements['name'].value.trim();
      var website = form.elements['website'].value;

      if (!email) {
        errorBox.textContent = 'Please enter your email address.';
        errorBox.style.display = 'block';
        return;
      }

      var submitBtn = form.querySelector('.bc-lm-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Unlocking…';

      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name,
          leadMagnet: magnetKey,
          postSlug: postSlug,
          website: website,
        }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
        .then(function (res) {
          if (!res.ok) {
            errorBox.textContent = res.data.error || 'Something went wrong. Please try again.';
            errorBox.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Get the Free Checklist';
            return;
          }
          card.querySelector('.bc-lm-form').outerHTML =
            '<div class="bc-lm-success">' +
              'You&#39;re all set — your download is ready.' +
              '<br><a class="bc-lm-download" href="' + res.data.downloadUrl + '" target="_blank" rel="noopener">Download Now &#8594;</a>' +
            '</div>';
          card.querySelector('.bc-lm-note').style.display = 'none';
        })
        .catch(function () {
          errorBox.textContent = 'Network error. Please try again.';
          errorBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Get the Free Checklist';
        });
    });
  }

  function init() {
    var containers = document.querySelectorAll('[data-lead-magnet]');
    if (!containers.length) return;
    injectStyles();
    containers.forEach(renderWidget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
