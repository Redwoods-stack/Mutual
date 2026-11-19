// Tiny local server that behaves like Netlify for this site: /programs serves programs.html, unknown paths serve 404.html.
//   node scripts/serve.js 8080
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), port = +process.argv[2] || 8080;
const types = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', mp4: 'video/mp4', xml: 'application/xml', txt: 'text/plain', svg: 'image/svg+xml' };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  let f = path.join(root, u); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  let code = 200;
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { if (fs.existsSync(f + '.html')) f += '.html'; else { f = path.join(root, '404.html'); code = 404; } }
  res.writeHead(code, { 'content-type': types[f.split('.').pop()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(port);
