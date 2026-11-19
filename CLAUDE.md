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
