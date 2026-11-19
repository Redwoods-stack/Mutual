# Mutual — public website

Marketing site for **Mutual (The Mutual Golf)**: a modern golf media platform (YouTube shows, vertical
series, editorial, events, products). Part of Redwoods Digital Growth Group. Layout follows themaple.media;
colours and type are Mutual's own.

## Structure
- Plain HTML / CSS / JS, no build step. Hosted on Netlify (`netlify.toml`, publish = repo root).
- Pages: `index.html`, `programs.html`, `events.html`, `products.html`, `collaborations.html`, `about.html`,
  `thanks.html` (form success). Each page is a shell: `#header`, `#main`, `#footer`.
- `js/main.js` renders the shared header/footer and every section from **`data/site.json`** (single source of
  truth). The page name picks the section list (`PAGES` in main.js).
- `css/style.css` — one stylesheet; tokens in `:root`. Append new blocks at the end. Check braces balance after
  scripted edits.
- Assets: `assets/img/` (photos; most were replaced in Nov 2026 with higher-resolution images from *THE MUTUAL GOLF - Media Kit 2026.pdf*; a few with no clean kit equivalent are still ~520px: yt-convert, yt-playoff, ido-documentary, fd-groundwave, club-activations, talent, brands-wall, ev-charity), `assets/logos/`
  (Mutual black/white, mark, group portfolio logos in `group/`), `assets/video/showreel-1080.mp4` + `showreel-720.mp4` (hero, muted loop; phones get the 720 file via a `media` source; both encoded from the 4K master *SHOWREEL MUTUAL 2026_1_2.MP4*, no audio).
- Contact form on Collaborations uses Netlify Forms (`data-netlify`, enabled on the mutualweb project). A hidden static copy sits in `collaborations.html` so Netlify detects it at deploy; keep its field names in sync with the form in main.js.
- Netlify project: **mutualweb** (https://mutualweb.netlify.app), auto-deploys from `main`, public (team protection off). The empty `mutual-golf` project is unused.

## Design language
- Deep green `--green #123a2a` (Maple's purple role), cream ribbon `--cream`, lime `--lime` for numbers on green.
- Archivo (wide, uppercase, 800) for headings; Instrument Serif italic for accent words; Inter for body.
- Hairlines, square cream cards, pill buttons. Header: logo · nav · "Let's collaborate" · burger + circle-reveal on phones.

## Content notes / placeholders
- Email `hello@mutual.golf` and social links are PLACEHOLDERS (`brand.email_placeholder: true`).
- Stats use the Media Kit 2026 figures (2.4M reached, 300M media views, 3.38M hours, 10K+ community).
- The showreel already has "THE NEW CULTURE OF GOLF" burned in — don't overlay the tagline on it.

## Roadmap
1. Preview site (this) ✔
2. CMS dashboard (`admin.html`) on Netlify Functions committing `data/site.json` + uploaded images to GitHub
   (Maple pattern). Then pre-render sections into HTML between `CMS:` markers for SEO.
3. Live YouTube / Instagram feeds via cached `/api/*` functions.

## Media Kit 2026 asset refresh (Nov 2026)
- Photos, the three Mutual Card designs, the course (15) and brand (40) logo sheets and the white footer logo come from the Media Kit 2026 PDF.
- `exp-bg.jpg` is the homepage "Off the screen" background (was reusing `ev-major-reality.jpg`). `case-appi.jpg` is the APPI case image.
- `logos-courses-wide.jpg` is rebuilt from the kit's 3x5 course grid into 5x3; `logos-brand.jpg` is a crop of the kit's brand sheet. The two panels are equal columns (CSS block at the end of style.css).
- Kit YouTube embeds (with the YouTube play button burned in) were deliberately not used as thumbnails.
- Content synced from the kit: event figures (Charity Classic, Major Vol. 1/2, Market, Coach Says Live), five vertical series, Orangegrounds × Mutual and Akross × Mutual merch, card tiers, Golf Tour hosts, extra partner pills. Homepage shows the first three products only.
- Not published on purpose: the kit's contact people (names, emails, phone numbers) and the Charity Classic revenue figure — owner to decide. `hello@mutual.golf` is still a placeholder.

## Programme and event logos (Nov 2026)
- Program and event names are shown as their Media Kit logos. Each item in `data/site.json` has `logo` (colour PNG in `assets/logos/programs/`), `logo_r` (width/height, used to size it) and optional `logo_note` (small label, e.g. "Vol. 2").
- Every logo also has a `-ink.png` twin in one dark green ink; `nmIn()` in main.js uses the ink one on light pages, `lgImg()` uses the colour one on dark sections (homepage "Off the screen"). The text name stays in the markup, visually hidden.
- Owner chose "ink on cream" over green caption cards and logo-on-photo. Ticker and the small name lists in the homepage cards stay as text.
- "Can We Even Swing?" uses the kit's "Convert Tryout" logo. Vol. 2, Reality Show and the Club & Card launch share the Mutual Major script logo with a note.

## Google Drive asset refresh (Nov 2026)
- Source: shared Drive folder "mutual-golf-dashboard" (assets/, LOGO/, Thumbnail October/).
- Header + ribbon logo is now `assets/logos/mutual-green.png` (official dark-green stacked logo, from a 4167px master).
  `mutual-lime.png` (lime version) is saved for dark sections but not used yet. `mutual-black.png` is no longer referenced.
- Favicon `assets/logos/favicon.png` + `apple-touch-icon.png` = "MM LOGOGRAM VAR 1-3" (lime mark on dark green). `mark.png` (pattern) = the emblem cut from the green logo.
- Real 4K YouTube thumbnails (resized to 1600w): yt-asmr (ASMR ep.14 Sentul), yt-fairway (Fairway Talk ep.7 pt.1),
  yt-playoff (Almay vs Aldwin pt.1), yt-coach (Coach Says × Almay, Tee Off Strategy), ido-documentary (Dokumentasi ep.3).
  Verticals (900w): v-hottakes (Arswandaru), v-restore (Almay "What's in My Golf Bag").
- Program logos rebuilt from large masters: playoff.png (logo_r 2.17), golf-tour.png, each with a regenerated -ink twin.
- Still low-res, no better file in Drive: yt-convert, yt-state, fd-groundwave, club-activations, talent, brands-wall.

## Homepage visuals round 2 (Nov 2026)
- Removed on owner request: the black brand-logo wall (brands-wall.jpg, on home + Collaborations), the homepage "100+ talent" strip,
  and the "100+ talent & influencers" figure in the brands band. The image files stay in assets/ but are unused.
- "On every screen" cards: `pillars[].items` = {name, logo, logo_r, logo_note, img, tall}. Each card cross-fades through its items
  every 3.2 s (cards start 0.8 s apart); the matching ink logo lights up; hover/tap a logo to pick it. Respects reduced motion.
  Tall (portrait) images show whole on a blurred copy of themselves. Only sharp images are listed
  (landscape ≥1000 px wide, portrait ≥800 px tall) — State of Par, Can We Even Swing?, Groundwave and Coach Says Live are left out until better images exist.
- "Off the screen" band: photo grid of `experience_events` (6 events, by name) with colour logos, linking to Events.

## Round 3 (Nov 2026)
- "On every screen": pillars[1] and [2] (vertical, editorial) use `layout: "strip"` — three tall pictures side by side fill the
  card, current one bright, the strip slides as it cycles (no blurred sides any more). YouTube and experiences cross-fade.
- Soft images taken out of the cards: Golf Tour (yt-tour), Mutual Major Vol. 1 and 2 (ev-major1/2), Charity Classic poster.
  Experiences card = Reality Show, Grounds Market, Club & Card launch. Logo buttons show `logo_note` next to the logo.
- The Mutual Card product image is back to the original three-card photo (Infinite / Silver / Millennial, white background,
  tile background white). The green/red/black Mutual-branded card designs from the kit were reverted on owner request.

## Drive re-check (Nov 2026)
- New files found in Drive `data-source/`. Replaced: yt-tour (Golf Tour Royale thumbnail, 1920 → 1600w), v-golf60 (GI60 "Dari Pasir ke
  Tee Box" 4K → 900w), fd-groundwave (Hesketh Golf Club cover 543×720, was 330), ev-coach-live (official Coach Says Live poster,
  20 Sept 2026 The Range, 1081×1440, was a 615px photo). Golf Tour and Groundwave are back in the homepage cards.
- Still low-res with no better file in Drive: yt-convert (Can We Even Swing?), yt-state (State of Par), v-offcourse, v-onehole,
  club-activations, ev-charity (830px), ev-pre (1024px).

## Working agreement (Nov 2026)
- Owner: "whenever I say push, push it live" → on "push", fast-forward `main` (production, serves https://mutual.golf).
  Without "push", work on a preview branch and ask.
- Products can be hidden with `"hidden": true` (The Mutual Card is hidden). About: `about.show_audience` and
  `about.show_ecosystem` (both false = audience facts and the Redwoods ecosystem section are hidden; data kept).
- Netlify team "Redwoods" (free plan) hit "usage exceeded" on 19 Nov 2026 → every page of mutualweb returned 503.
  Each production deploy and each deploy preview uses plan credits, and the homepage showreel is several MB per visit.
  Batch changes into fewer pushes; avoid opening preview PRs for small changes.

## Products page — featured drop (Nov 2026)
- Owner chose option "B · Campaign banner" (without the lime pill tag: "too AI slop" — avoid rounded lime badges).
- A product with `"featured": true` (now Akross × Mutual) gets: full-width `banner` photo with `kicker` / name / `sub`,
  a cream ribbon with its `text`, a 3-photo `gallery` strip, then the other products as "Past drops & activations".
  To feature the next drop, move `featured` + banner/gallery to that product. Homepage products section is unchanged.
- Akross photos: akross-editorial (4K Drive "Akross Teaser Editorial", 1400w), akross-locker ("Teaser Daru Andrey", 1000w),
  akross-studio / akross-course (the two halves of merch-akross.jpg).

## Round 7 (Nov 2026)
- Contact = WhatsApp: `brand.whatsapp` (6281318627650) / `whatsapp_display`. Every "Let's collaborate", "Send a brief" and footer
  Contact link opens wa.me (`waAttr()` in main.js). The Netlify form stays on Collaborations as a second option under a WhatsApp button.
  The placeholder email is no longer shown.
- Header logo is animated: `logoAnim()` = mutual-green-base.png (ring, poles, wordmark) + flag-1/2/3.png layers positioned in %
  and waving from the pole side (`@keyframes flagWave`, different speeds). Respects reduced motion.
- Removed the drifting logo pattern band above the homepage ticker. Phone hero video is 16:9 (whole frame, no crop).
- About: `about.pillars` (3 pillars: text, points, link, 4 images = tall, wide, 2 small) replaces the three-card row.

## SEO structure (Nov 2026)
- Clean addresses: `/programs`, `/events`, `/products`, `/collaborations`, `/about` (files are still `*.html`; Netlify serves them
  without the extension and `netlify.toml` 301-redirects the `.html` addresses). All links are root-absolute; every page has `<base href="/">`
  and `<body data-page>` (main.js picks the page from it).
- Page shells are GENERATED — do not hand-edit `*.html`, `sitemap.xml`, `robots.txt`. Edit `scripts/pages.json` (title, description,
  share-image words and photo), then run:
    `python3 scripts/seo.py` → `node scripts/serve.js 8080 &` → `node scripts/share-images.js http://localhost:8080` (only if share words/photos changed)
    → `node scripts/prerender.js http://localhost:8080`
- **Re-run seo.py + prerender.js after ANY change to data/site.json or js/main.js**: prerender writes the rendered content into `<main>`
  so search engines and link previews read real text; main.js re-renders over it. (The future CMS save must do the same.)
- Each page: title, description, canonical (https://www.mutual.golf), Open Graph + Twitter tags, 1200×630 share image in `assets/share/`,
  JSON-LD (Organization + WebSite on home, BreadcrumbList elsewhere), one h1. `404.html` = not-found page.
- Contact is WhatsApp only: the Netlify form, its hidden static copy and `thanks.html` were removed on owner request.
- Local testing: `node scripts/serve.js <port>` (python's http.server cannot serve the clean addresses).

- `googlee8a6faaf4ec20a18.html` at the root is the Google Search Console ownership file — keep it, never delete or rename.

## Homepage top strip (Nov 2026)
- Owner chose "B · Big headline": the programme-name ticker is replaced by `.bigmq`, two rows of oversized type moving in opposite
  directions (`hero.marquee` in site.json: rows of [text, style]; b = solid caps, o = outlined caps, i = serif italic).
  Other options shown and not chosen: logo strip, "Now showing" bar, thumbnail filmstrip.
- When piping `scripts/prerender.js` output, never cut it with `head` — that kills it mid-run and leaves pages without content.

## YouTube videos without an API key (Nov 2026)
- `netlify/functions/videos.mjs` serves **/api/videos** from YouTube's public feeds for @TheMutualGolf (channel UCI6C1BqCtVmBl2a0zQ8zjkg):
  long videos (playlist `UULF…`), Shorts (`UUSH…`, only used to exclude them) and one playlist per program. Max 15 per feed, no durations.
  `PROGRAMS` in that file maps program names (as in site.json) → playlist id + title pattern. Coach Says and Off Course have no
  playlist id yet (matched by title from the latest 15 only; Off Course currently shows none). Teaser clips ("out now", "is out",
  "have you watched") are filtered out by title.
- Edge-cached 30 min + stale-while-revalidate, so the function runs rarely. Fallback: `data/videos.json`
  (`node scripts/videos-snapshot.mjs`), also what prerender bakes into the HTML — refresh it before each prerender.
- Site: homepage "Latest videos" (8 newest) and "Latest episodes" (3) under each YouTube show on Programs. Cards are real YouTube
  links (`a[data-yt]`); main.js opens them in an on-site player window (youtube-nocookie embed). Thumbnails: maxresdefault with
  fallback to mqdefault when YouTube returns its 120px placeholder.
