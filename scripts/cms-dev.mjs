// Local test server for the dashboard: serves the site like Netlify, runs netlify/functions/cms.mjs for /api/cms,
// and stands in for GitHub with an in-memory copy of the repo (nothing real is touched).
//   node scripts/cms-dev.mjs 8090        password printed on start; commits are listed at GET /__commits
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), ".."), port = +process.argv[2] || 8090;
const PASSWORD = process.env.CMS_TEST_PASSWORD || "test-password-123";
const salt = crypto.randomBytes(16);
process.env.CMS_PASSWORD_HASH = `scrypt$${salt.toString("hex")}$${crypto.scryptSync(PASSWORD, salt, 32).toString("hex")}`;
process.env.CMS_SECRET = crypto.randomBytes(32).toString("hex");
if (!process.env.CMS_NO_TOKEN) process.env.CMS_GITHUB_TOKEN = "local-test-token";
process.env.CMS_GITHUB_API = `http://localhost:${port}/__gh`;
const { default: cms } = await import("../netlify/functions/cms.mjs");

// ---- stand-in GitHub ----
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex");
const blobSha = (buf) => crypto.createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
const repo = { head: sha("c0"), files: { "data/site.json": fs.readFileSync(path.join(root, "data/site.json")) }, blobs: {}, trees: {}, commits: {}, log: [] };
repo.commits[repo.head] = { tree: sha("t0") }; repo.trees[sha("t0")] = { ...repo.files };
function ghMock(req, body, res) {
  const u = new URL(req.url, "http://x"), p = u.pathname.replace(/^\/__gh\/repos\/[^/]+\/[^/]+/, ""), send = (code, o) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
  if (req.headers.authorization !== "Bearer local-test-token") return send(401, {});
  if (req.method === "GET" && p === "/git/ref/heads/main") return send(200, { object: { sha: repo.head } });
  if (req.method === "GET" && p.startsWith("/contents/")) { const f = repo.trees[repo.commits[u.searchParams.get("ref")].tree][p.slice(10)]; return f ? send(200, { sha: blobSha(f), content: f.toString("base64") }) : send(404, {}); }
  if (req.method === "GET" && p.startsWith("/git/commits/")) return send(200, { tree: { sha: repo.commits[p.slice(13)].tree } });
  const j = body ? JSON.parse(body) : {};
  if (req.method === "POST" && p === "/git/blobs") { const b = Buffer.from(j.content, "base64"), s = blobSha(b); repo.blobs[s] = b; return send(201, { sha: s }); }
  if (req.method === "POST" && p === "/git/trees") { const t = { ...repo.trees[j.base_tree] }; for (const e of j.tree) t[e.path] = e.content != null ? Buffer.from(e.content) : repo.blobs[e.sha]; const s = sha(JSON.stringify(Object.keys(t)) + Math.random()); repo.trees[s] = t; return send(201, { sha: s, tree: [] }); }
  if (req.method === "POST" && p === "/git/commits") { const s = sha(j.message + j.tree + Math.random()); repo.commits[s] = { tree: j.tree, message: j.message, parents: j.parents }; return send(201, { sha: s }); }
  if (req.method === "PATCH" && p === "/git/refs/heads/main") { if (repo.commits[j.sha].parents[0] !== repo.head) return send(422, {}); repo.head = j.sha; const t = repo.trees[repo.commits[j.sha].tree]; repo.log.push({ message: repo.commits[j.sha].message, files: Object.keys(t).filter((k) => !repo.files[k] || !repo.files[k].equals(t[k])) }); repo.files = t; return send(200, {}); }
  send(404, {});
}

const types = { html: "text/html; charset=utf-8", css: "text/css", js: "text/javascript", mjs: "text/javascript", json: "application/json", png: "image/png", jpg: "image/jpeg", mp4: "video/mp4", xml: "application/xml", txt: "text/plain" };
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks).toString();
  let u = decodeURIComponent(req.url.split("?")[0]);
  if (u.startsWith("/__gh/")) return ghMock(req, body, res);
  if (u === "/__commits") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(repo.log)); }
  if (u === "/__site") { res.writeHead(200, { "content-type": "application/json" }); return res.end(repo.files["data/site.json"]); }
  if (u === "/__bump") { const s = JSON.parse(repo.files["data/site.json"]); s.__bump = Date.now(); const t = { ...repo.files, "data/site.json": Buffer.from(JSON.stringify(s)) }; const ts = sha("bt" + Math.random()), cs = sha("bc" + Math.random()); repo.trees[ts] = t; repo.commits[cs] = { tree: ts, parents: [repo.head] }; repo.head = cs; repo.files = t; res.writeHead(200); return res.end("bumped"); }
  if (u === "/api/cms") {
    const r = await cms(new Request(`http://localhost:${port}/api/cms`, { method: req.method, headers: req.headers, body: req.method === "POST" ? body : undefined }));
    res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(await r.text());
  }
  if (u.startsWith("/assets/uploads/") && repo.files[u.slice(1)]) { res.writeHead(200, { "content-type": "image/jpeg" }); return res.end(repo.files[u.slice(1)]); }
  if (u.endsWith("/")) u += "index.html";
  let f = path.join(root, u), code = 200; if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { if (fs.existsSync(f + ".html")) f += ".html"; else { f = path.join(root, "404.html"); code = 404; } }
  res.writeHead(code, { "content-type": types[f.split(".").pop()] || "application/octet-stream", "cache-control": "no-store" }); fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log(`dashboard: http://localhost:${port}/admin   password: ${PASSWORD}`));
