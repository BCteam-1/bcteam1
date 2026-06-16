/* =====================================================
   BC TEAM — COMPONENTS.JS
   Shared nav, footer, exit intent, scroll behaviour
   ===================================================== */

const BOOK_URL   = 'https://outlook.office.com/book/RAPDemo@bcteam1.com/s/oJIITW3tvU6B_Uprrd6WAA2';
const PHONE_DISPLAY = '+1 (226) 747-7679';
const PHONE_TEL     = 'tel:+12267477679';
const EMAIL         = 'bc@bcteam1.com';

// ── Replace these keys before launch ─────────────────
const W3F_KEY_CONTACT  = '03a2b70c-6628-409d-9379-ba9129baec1d';   // web3forms.com → bc@bcteam1.com
const W3F_KEY_SCORECARD= '03a2b70c-6628-409d-9379-ba9129baec1d';  // same account, second form key
const W3F_KEY_EXIT     = '03a2b70c-6628-409d-9379-ba9129baec1d';       // same account, third form key

// ── Analytics IDs — fill in after account setup ──────
const GA4_ID       = 'G-XXXXXXXXXX';   // Google Analytics 4
const CLARITY_ID   = 'x7l87wky7t';     // Microsoft Clarity project ID
const LI_PARTNER   = '1234567';        // LinkedIn Insight Tag partner ID

// =====================================================

function renderNavbar(activePage) {
  const pages = [
    { href: '/index.html',                  label: 'Home',     id: 'home' },
    { href: '/pages/rap.html',              label: 'RAP',      id: 'rap' },
    {
      href: '/pages/services.html', label: 'Services', id: 'services',
      dropdown: [
        { href: '/pages/bc-implementation.html', label: '🏗️  BC Implementation' },
        { href: '/pages/bc-rescue-audit.html',   label: '🚑  BC Rescue Audit' },
        { href: '/pages/bc-optimization.html',   label: '⚙️  BC Optimization' },
      ]
    },
    { href: '/pages/about.html',            label: 'About',    id: 'about' },
    { href: '/pages/contact.html',          label: 'Contact',  id: 'contact' },
  ];

  const linksHTML = pages.map(p => {
    const isActive = p.id === activePage;
    const activeClass = isActive ? ' class="active"' : '';
    if (p.dropdown) {
      const items = p.dropdown.map(d => `<li><a href="${d.href}">${d.label}</a></li>`).join('');
      return `<li><a href="${p.href}"${activeClass}>${p.label} ▾</a><ul class="dropdown">${items}</ul></li>`;
    }
    return `<li><a href="${p.href}"${activeClass}>${p.label}</a></li>`;
  }).join('');

  const mobileLinks = pages.map(p => {
    let html = `<a href="${p.href}">${p.label}</a>`;
    if (p.dropdown) {
      html += p.dropdown.map(d => `<a href="${d.href}" style="padding-left:28px;font-size:13px;opacity:0.75;">↳ ${d.label.replace(/[🏗️🚑⚙️]\s*/g,'')}</a>`).join('');
    }
    return html;
  }).join('');

  document.getElementById('navbar-placeholder').innerHTML = `
    <nav class="navbar" id="main-nav">
      <div class="navbar-inner">
        <a href="/index.html" class="navbar-logo">
          <img src="/assets/logo-icon.png" alt="BC Team" style="height:40px;width:auto;display:block;">
          <span>BC TEAM</span>
        </a>
        <ul class="nav-links">${linksHTML}</ul>
        <div class="navbar-right">
          <a href="${PHONE_TEL}" class="navbar-phone">${PHONE_DISPLAY}</a>
          <a href="${BOOK_URL}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Book a Demo</a>
        </div>
        <button class="mobile-btn" onclick="toggleMobile()" aria-label="Toggle menu" aria-expanded="false">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="mobile-nav" id="mobile-nav" aria-hidden="true">
        ${mobileLinks}
        <a href="${PHONE_TEL}" style="color:var(--blue);">${PHONE_DISPLAY}</a>
        <a href="${BOOK_URL}" target="_blank" rel="noopener" class="btn btn-primary" style="margin-top:12px;text-align:center;border-bottom:none;">Book a Demo</a>
      </div>
    </nav>`;

  // Sticky shadow on scroll
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });
}

function toggleMobile() {
  const mn = document.getElementById('mobile-nav');
  const btn = document.querySelector('.mobile-btn');
  const open = mn.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
  mn.setAttribute('aria-hidden', !open);
}

// ── FOOTER ─────────────────────────────────────────────
function renderFooter() {
  document.getElementById('footer-placeholder').innerHTML = `
    <footer class="footer">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="/assets/logo-icon.png" alt="BC Team" style="height:36px;width:auto;display:block;">
            <span>BC TEAM</span>
          </div>
          <p>Helping mid-sized businesses implement, rescue, and optimize Microsoft Dynamics 365 Business Central — across Canada and the US.</p>
          <div class="footer-address">
            <strong style="color:rgba(255,255,255,0.5);font-family:'Nunito Sans',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Canada HQ</strong><br>
            577 Manorwood Court<br>Waterloo, ON N2K 3L6<br><br>
            <a href="mailto:${EMAIL}" style="color:rgba(255,255,255,0.55);">${EMAIL}</a><br>
            <a href="${PHONE_TEL}" style="color:rgba(255,255,255,0.55);">${PHONE_DISPLAY}</a>
          </div>
          <div class="social-links" style="margin-top:20px;">
            <a href="https://www.linkedin.com/in/bc-team" target="_blank" rel="noopener" class="social-link" aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://www.youtube.com/@BCTeam_" target="_blank" rel="noopener" class="social-link" aria-label="YouTube">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Services</h4>
          <ul>
            <li><a href="/pages/bc-implementation.html">BC Implementation</a></li>
            <li><a href="/pages/bc-rescue-audit.html">BC Rescue Audit</a></li>
            <li><a href="/pages/bc-optimization.html">BC Optimization</a></li>
            <li><a href="/pages/rap.html">RAP — AR Automation</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="/pages/about.html">About Taylor</a></li>
            <li><a href="/index.html#case-study">Client Results</a></li>
            <li><a href="/pages/contact.html">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="/pages/privacy.html">Privacy Policy</a></li>
            <li><a href="/pages/privacy.html#casl">CASL Compliance</a></li>
            <li><a href="mailto:${EMAIL}">Unsubscribe</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 BC TEAM — 1000228250 Ontario Inc. All Rights Reserved. &nbsp;|&nbsp; <a href="/pages/privacy.html">Privacy Policy</a></p>
        <p>Microsoft Certified Partner &nbsp;|&nbsp; Waterloo, ON Canada</p>
      </div>
    </footer>`;
}

// ── EXIT INTENT ─────────────────────────────────────────
(function initExitIntent() {
  let fired = false;
  const STORAGE_KEY = 'bc_ei_dismissed';

  function alreadyDismissed() {
    try { return sessionStorage.getItem(STORAGE_KEY) === '1'; } catch(e) { return false; }
  }
  function dismiss() {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch(e) {}
  }

  function injectOverlay() {
    const div = document.createElement('div');
    div.className = 'ei-overlay';
    div.id = 'ei-overlay';
    div.innerHTML = `
      <div class="ei-box" role="dialog" aria-modal="true" aria-label="Free AR Checklist">
        <button class="ei-close" id="ei-close" aria-label="Close">✕</button>
        <div class="ei-icon">📋</div>
        <h3>Before you go — free AR checklist</h3>
        <p>12 things your AR process should be doing automatically. Used by Controllers across Canada to find hidden cash flow leaks.</p>
        <div class="ei-form" id="ei-form">
          <input type="text" id="ei-name" placeholder="Your first name" autocomplete="given-name" required>
          <input type="email" id="ei-email" placeholder="Work email" autocomplete="email" required>
          <div class="ei-consent">
            <input type="checkbox" id="ei-consent-cb">
            <label for="ei-consent-cb">I agree to receive the checklist and occasional BC tips from BC Team. <a href="/pages/privacy.html" target="_blank">Privacy policy</a>. Unsubscribe anytime.</label>
          </div>
          <button class="btn btn-primary" id="ei-submit" style="width:100%;">Send me the checklist →</button>
        </div>
        <div class="ei-skip"><button id="ei-skip">No thanks, I don't need this</button></div>
      </div>`;
    document.body.appendChild(div);

    document.getElementById('ei-close').onclick = closeEI;
    document.getElementById('ei-skip').onclick  = closeEI;
    div.addEventListener('click', e => { if (e.target === div) closeEI(); });
    document.getElementById('ei-submit').onclick = submitEI;

    requestAnimationFrame(() => { div.classList.add('visible'); });
  }

  function closeEI() {
    dismiss();
    const ov = document.getElementById('ei-overlay');
    if (ov) { ov.classList.remove('visible'); setTimeout(() => ov.remove(), 300); }
  }

  function submitEI() {
    const name  = (document.getElementById('ei-name')?.value || '').trim();
    const email = (document.getElementById('ei-email')?.value || '').trim();
    const consent = document.getElementById('ei-consent-cb')?.checked;
    if (!name || !email || !consent) { alert('Please fill in all fields and accept the consent checkbox.'); return; }
    const btn = document.getElementById('ei-submit');
    btn.disabled = true; btn.textContent = 'Sending…';
    const payload = { access_key: W3F_KEY_EXIT, subject: 'AR Checklist Request — ' + name, from_name: 'BC Team Website', name, email, botcheck: '' };
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
      .then(r => r.json()).then(() => {
        const form = document.getElementById('ei-form');
        const skip = document.querySelector('.ei-skip');
        if (form) form.innerHTML = '<div class="ei-success"><h4>✓ On its way!</h4><p>Check your inbox — the checklist will arrive within a few minutes.</p></div>';
        if (skip) skip.style.display = 'none';
        dismiss();
        setTimeout(closeEI, 4000);
      }).catch(() => { btn.disabled = false; btn.textContent = 'Send me the checklist →'; });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (alreadyDismissed()) return;
    // Desktop: mouse leaves viewport toward top
    document.addEventListener('mouseleave', e => {
      if (fired || alreadyDismissed()) return;
      if (e.clientY < 10) { fired = true; injectOverlay(); }
    });
    // Mobile: scroll back up 300px after scrolling down 600px
    let maxScroll = 0, mFired = false;
    window.addEventListener('scroll', () => {
      if (mFired || alreadyDismissed()) return;
      const s = window.scrollY;
      if (s > maxScroll) maxScroll = s;
      if (maxScroll > 600 && s < maxScroll - 300) { mFired = true; fired = true; injectOverlay(); }
    }, { passive: true });
  });
})();

// ── TRACKING INJECTION ───────────────────────────────────
(function injectTracking() {
  // Google Analytics 4
  if (GA4_ID && GA4_ID !== 'G-XXXXXXXXXX') {
    const s = document.createElement('script');
    s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', GA4_ID);
    window.gtag = gtag;
  }
  // Microsoft Clarity
  if (CLARITY_ID && CLARITY_ID !== 'x7l87wky7t') {
    (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,'clarity','script',CLARITY_ID);
  }
  // LinkedIn Insight Tag
  if (LI_PARTNER && LI_PARTNER !== '1234567') {
    window._linkedin_partner_id = LI_PARTNER;
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(LI_PARTNER);
    (function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}
    var s=document.getElementsByTagName('script')[0];var b=document.createElement('script');
    b.type='text/javascript';b.async=true;b.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';
    s.parentNode.insertBefore(b,s);})(window.lintrk);
  }
})();

// ── CONTACT FORM HANDLER ──────────────────────────────────
function initContactForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const consent = form.querySelector('input[name=consent]');
    if (consent && !consent.checked) { alert('Please accept the consent checkbox to continue.'); return; }
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    data.access_key = W3F_KEY_CONTACT;
    data.from_name  = 'BC Team Website Contact';
    data.botcheck   = '';
    try {
      const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (j.success) {
        form.innerHTML = '<div style="text-align:center;padding:40px 0;"><div style="font-size:48px;margin-bottom:16px;">✅</div><h3 style="font-size:22px;font-weight:900;margin-bottom:8px;">Message received!</h3><p style="color:#666;">Taylor will be in touch within 1 business day.</p></div>';
      } else { throw new Error('Submit failed'); }
    } catch(_) { btn.disabled = false; btn.textContent = orig; alert('Something went wrong. Please email us directly at ' + EMAIL); }
  });
}
