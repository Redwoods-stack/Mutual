// Makes the 1200x630 share images (assets/share/<page>.jpg) from scripts/pages.json.
// Run from the repo root while a static server serves it:  node scripts/share-images.js http://localhost:8080
const { chromium } = require('playwright');
const cfg = require('./pages.json');
const base = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const pg of cfg.pages) {
    await p.setContent(`<!doctype html><base href="${base}/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..900&family=Instrument+Serif:ital@0;1&display=swap">
      <style>*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;position:relative;overflow:hidden;background:#0c2a1e;color:#fff}
      .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 28%}
      .sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,42,30,.55) 0%,rgba(12,42,30,.05) 32%,rgba(12,42,30,.2) 50%,rgba(12,42,30,.92) 100%)}
      .lg{position:absolute;left:64px;top:52px;height:64px}
      .t{position:absolute;left:64px;right:64px;bottom:56px}
      .h{font-family:Archivo;font-weight:800;font-stretch:112%;text-transform:uppercase;font-size:76px;line-height:.95;letter-spacing:-.01em}
      .s{font-family:'Instrument Serif';font-style:italic;font-size:70px;line-height:1.05}
      .u{position:absolute;right:64px;top:74px;font-family:Archivo;font-weight:600;font-size:20px;letter-spacing:.16em;text-transform:uppercase;opacity:.9}</style>
      <img class="bg" src="${pg.img}"><div class="sh"></div><img class="lg" src="assets/logos/mutual-white.png"><div class="u">mutual.golf</div>
      <div class="t"><div class="h">${pg.h}</div><div class="s">${pg.s}</div></div>`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `assets/share/${pg.file}.jpg`, type: 'jpeg', quality: 86 });
    console.log('share image', pg.file);
  }
  await b.close();
})();
