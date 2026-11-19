// Fills <main> in each page with the rendered content, so search engines and link previews see real text
// without running JavaScript. main.js re-renders over it in the browser.
// Run after scripts/seo.py and after ANY change to data/site.json or js/main.js:
//   node scripts/prerender.js http://localhost:8080      (a static server on the repo root that serves /programs etc.)
const { chromium } = require('playwright');
const fs = require('fs');
const cfg = require('./pages.json');
const base = process.argv[2];
(async () => {
  const b = await chromium.launch();
  for (const pg of cfg.pages.map((p) => p.file).concat(['404'])) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(`${base}/${pg}.html`, { waitUntil: 'load' });
    await p.waitForFunction(() => document.querySelector('.site-header') && document.querySelector('#main').children.length > 0);
    const html = await p.evaluate(() => {
      const m = document.getElementById('main').cloneNode(true);
      m.querySelectorAll('.on').forEach((e, i) => { }); // keep first-slide state as rendered
      m.querySelectorAll('video').forEach((v) => { v.removeAttribute('autoplay'); v.setAttribute('preload', 'none'); });
      return m.innerHTML;
    });
    const f = `${pg}.html`; const src = fs.readFileSync(f, 'utf8');
    const out = src.replace(/<!-- PRERENDER:START -->[\s\S]*<!-- PRERENDER:END -->/, () => `<!-- PRERENDER:START -->${html}<!-- PRERENDER:END -->`);
    fs.writeFileSync(f, out); console.log('prerendered', f, html.length, 'chars');
    await p.close();
  }
  await b.close();
})();
