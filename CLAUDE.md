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
- Assets: `assets/img/` (photos, from the Mutual × The Card deck — ~520px wide, low-res), `assets/logos/`
  (Mutual black/white, mark, group portfolio logos in `group/`), `assets/video/showreel.mp4` (hero, muted loop).
- Contact form on Collaborations uses Netlify Forms (`data-netlify`); form detection must be on in Netlify.

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
