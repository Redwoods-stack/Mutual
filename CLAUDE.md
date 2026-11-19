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
