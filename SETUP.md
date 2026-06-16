# BC Team Website — Launch Checklist

## Before You Go Live

### 1. Web3Forms (Lead Capture) — ✅ DONE
The access key `03a2b70c-6628-409d-9379-ba9129baec1d` is already set in `/components.js`
for the contact form, scorecard, and exit-intent forms. No further action needed.

### 2. Microsoft Clarity (Visitor Recordings) — ✅ DONE
Clarity project ID `x7l87wky7t` is already set in `/components.js` (`CLARITY_ID`).
Recordings/heatmaps will start collecting once the site is live.

### 3. Google Analytics 4 (Traffic Tracking — FREE)
1. Go to https://analytics.google.com
2. Create property → "BC Team" → Web → enter bcteam1.com
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)
4. Open `/components.js` → replace `'G-XXXXXXXXXX'` in `GA4_ID`

### 4. LinkedIn Insight Tag (B2B Retargeting — FREE)
1. Go to https://business.linkedin.com → Campaign Manager
2. Account Assets → Insight Tag → Install Manually
3. Copy your **Partner ID** (a number)
4. Open `/components.js` → replace `'1234567'` in `LI_PARTNER`

### 5. Taylor's Photo — ✅ DONE
Taylor's headshot is at `/assets/taylor.jpg` and wired into the homepage about
section and `pages/about.html`.

### 6. Booking URL
Current URL in `components.js`:
```
https://outlook.office.com/book/RAPDemo@bcteam1.com/s/oJIITW3tvU6B_Uprrd6WAA2
```
Verify this is the correct booking URL before launch. Update `BOOK_URL` in `components.js` if needed.

### 7. Logo — ✅ DONE
`/assets/logo-icon.svg` is the BC Team interlocking-links mark in brand colors
(red / blue / yellow / green). Favicon (`/assets/favicon.ico` + `favicon-32x32.png`)
is also wired in.

### 8. OG Images
- Add `/assets/og-home.jpg` (1200×630px) — homepage social share preview
- Add `/assets/og-rap.jpg` (1200×630px) — RAP page social share preview

### 9. Wix 301 Redirects
When DNS is cut over, any Wix pages that had Google indexed links need 301 redirects in `vercel.json`. Key ones to check in Google Search Console before launch.

---

## Deploy to Vercel via GitHub

```bash
# In terminal, from ~/Documents/BCTeam/website/
git init
git add .
git commit -m "Initial launch build"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/bcteam-website.git
git push -u origin main
```

Then in Vercel:
1. Import the GitHub repo
2. Framework: **Other** (static HTML, no build step)
3. Add custom domain: `www.bcteam1.com`
4. Set root domain redirect in Vercel: `bcteam1.com` → `www.bcteam1.com`

---

## File Structure
```
/
├── index.html              ← Homepage
├── style.css               ← All styles
├── components.js           ← Nav, footer, tracking, exit intent
├── vercel.json             ← Routing, headers, redirects
├── .gitignore
├── assets/
│   ├── favicon.svg         ← Replace with real favicon
│   └── logo-icon.svg       ← Replace with real logo
└── pages/
    ├── rap.html            ← RAP product page (AR scorecard)
    ├── services.html       ← Services overview
    ├── bc-implementation.html
    ├── bc-rescue-audit.html
    ├── bc-optimization.html
    ├── about.html
    ├── contact.html
    └── privacy.html        ← Privacy + CASL compliance
```

---

## Revenue-Driving Features Built In
- ✅ AR Health Scorecard (20 questions → lead + ROI estimate)
- ✅ Exit intent lead capture (AR Checklist PDF)
- ✅ Pricing on RAP page ($400/mo Standard, $600/mo Growth)
- ✅ "How It Works" 3-step (1 day to live)
- ✅ Cash flow forecasting feature highlighted
- ✅ CASL-compliant consent checkboxes on all forms
- ✅ Schema.org FAQ markup (Google rich results)
- ✅ LinkedIn Insight Tag (retarget every visitor)
- ✅ Microsoft Clarity (session recordings)
- ✅ Exit intent overlay (AR checklist lead magnet)
- ✅ Security headers (via vercel.json)
- ✅ Clean URLs (/rap instead of /pages/rap.html)
- ✅ Privacy Policy + CASL section (/pages/privacy.html)
