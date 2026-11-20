// POST /api/cms — the dashboard's only door. Actions: login, load, save.
// Secrets live in Netlify environment variables, never in the repo or the browser:
//   CMS_PASSWORD_HASH  scrypt hash of the dashboard password ("scrypt$<salt hex>$<hash hex>") — the password itself is stored nowhere
//   CMS_SECRET         random key that signs login tokens
//   CMS_GITHUB_TOKEN   fine-grained GitHub token for this repo only (Contents: read and write) — used to commit saves
// Saving = one atomic commit to main (data/site.json + any uploaded pictures) = Netlify redeploys the site.
import crypto from "node:crypto";
import { apply } from "../../cms/apply.mjs";

const REPO = "Redwoods-stack/mutual", BRANCH = "main", FILE = "data/site.json";
const SESSION_H = 12, REMEMBER_DAYS = 30, MAX_BODY = 5.5 * 1024 * 1024, MAX_IMG = 1.6 * 1024 * 1024, MAX_UPLOADS = 12;
const env = (k) => (globalThis.Netlify ? Netlify.env.get(k) : process.env[k]) || "";
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-robots-tag": "noindex" } });
const b64u = (buf) => Buffer.from(buf).toString("base64url");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const userErr = (status, msg) => { const e = new Error(msg); e.user = true; e.status = status; return e; };

function checkPassword(pw) {
  const [kind, salt, hash] = env("CMS_PASSWORD_HASH").split("$");
  if (kind !== "scrypt" || !salt || !hash || typeof pw !== "string" || pw.length > 200) return false;
  const want = Buffer.from(hash, "hex"), got = crypto.scryptSync(pw.normalize("NFKC"), Buffer.from(salt, "hex"), want.length);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}
const sign = (payload) => crypto.createHmac("sha256", env("CMS_SECRET")).update(payload).digest();
function makeToken(remember) {
  const exp = Date.now() + (remember ? REMEMBER_DAYS * 24 : SESSION_H) * 3600 * 1000;
  const p = b64u(JSON.stringify({ exp, v: 1 }));
  return { token: p + "." + b64u(sign(p)), exp };
}
function checkToken(req) {
  const m = /^Bearer ([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(req.headers.get("authorization") || "");
  if (!m || env("CMS_SECRET").length < 32) return false;
  const want = sign(m[1]), got = Buffer.from(m[2], "base64url");
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return false;
  try { return JSON.parse(Buffer.from(m[1], "base64url").toString()).exp > Date.now(); } catch (e) { return false; }
}

const API = process.env.CMS_GITHUB_API || "https://api.github.com"; // overridable only for the local test
async function gh(path, opts = {}) {
  const r = await fetch(`${API}/repos/${REPO}${path}`, { ...opts, headers: { authorization: "Bearer " + env("CMS_GITHUB_TOKEN"), accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "mutual-cms", ...(opts.body ? { "content-type": "application/json" } : {}) } });
  if (!r.ok) { const e = new Error(`GitHub ${r.status} on ${path.split("?")[0]}`); e.gh = r.status; throw e; }
  return r.json();
}
async function current() {
  const ref = await gh(`/git/ref/heads/${BRANCH}`); const head = ref.object.sha;
  const file = await gh(`/contents/${FILE}?ref=${head}`);
  let text = file.content ? Buffer.from(file.content, "base64").toString("utf8") : null;
  if (text == null) { const blob = await gh(`/git/blobs/${file.sha}`); text = Buffer.from(blob.content, "base64").toString("utf8"); }
  return { head, version: file.sha, site: JSON.parse(text) };
}

function picture(u, i) {
  if (!u || typeof u.id !== "string" || !/^[a-z0-9]{6,16}$/.test(u.id) || typeof u.data !== "string") throw userErr(400, "A picture did not upload properly. Please choose it again.");
  const buf = Buffer.from(u.data, "base64");
  if (buf.length > MAX_IMG) throw userErr(400, "A picture is larger than 1.5 MB after resizing. Please use a smaller one.");
  const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff, png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP";
  if (!jpg && !png && !webp) throw userErr(400, "Only JPG, PNG or WebP pictures can be uploaded.");
  const name = String(u.name || "picture").toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "picture";
  const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 10);
  return { id: u.id, path: `assets/uploads/${name}-${hash}.${jpg ? "jpg" : png ? "png" : "webp"}`, b64: buf.toString("base64") };
}

async function save(body) {
  if (!env("CMS_GITHUB_TOKEN")) throw userErr(503, "Saving is not connected yet: the GitHub token has not been added in Netlify.");
  if (typeof body.version !== "string") throw userErr(400, "Please reload the dashboard and try again.");
  const ups = (Array.isArray(body.uploads) ? body.uploads : []); if (ups.length > MAX_UPLOADS) throw userErr(400, `At most ${MAX_UPLOADS} new pictures per save. Save, then add the rest.`);
  const pics = ups.map(picture);
  const cur = await current();
  if (cur.version !== body.version) throw userErr(409, "The site content changed since you opened the dashboard (someone else saved, or the site was updated). Reload the dashboard — your unsaved edits here will need to be made again.");
  const next = apply(cur.site, body.site, Object.fromEntries(pics.map((p) => [p.id, p.path])));
  const text = JSON.stringify(next, null, 1) + "\n";
  const used = pics.filter((p) => text.includes(p.path));
  if (text === JSON.stringify(cur.site, null, 1) + "\n" && !used.length) return { ok: true, unchanged: true, version: cur.version };
  const commit = await gh(`/git/commits/${cur.head}`);
  const tree = [{ path: FILE, mode: "100644", type: "blob", content: text }];
  for (const p of used) { const blob = await gh("/git/blobs", { method: "POST", body: JSON.stringify({ content: p.b64, encoding: "base64" }) }); tree.push({ path: p.path, mode: "100644", type: "blob", sha: blob.sha }); }
  const t = await gh("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
  const c = await gh("/git/commits", { method: "POST", body: JSON.stringify({ message: "Dashboard: content update" + (used.length ? ` (+${used.length} picture${used.length > 1 ? "s" : ""})` : ""), tree: t.sha, parents: [cur.head] }) });
  try { await gh(`/git/refs/heads/${BRANCH}`, { method: "PATCH", body: JSON.stringify({ sha: c.sha, force: false }) }); }
  catch (e) { if (e.gh === 422 || e.gh === 409) throw userErr(409, "The site was updated at the same moment. Reload the dashboard and save again."); throw e; }
  const buf = Buffer.from(text, "utf8"); // git's own id for the new file, so the dashboard can keep saving without a reload
  const version = crypto.createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
  return { ok: true, commit: c.sha.slice(0, 7), version, site: next };
}

export default async (req) => {
  try {
    if (req.method !== "POST") return json(405, { error: "Not allowed" });
    // same-site requests only: the browser's Origin must be the host this function is served on
    const origin = req.headers.get("origin"), host = req.headers.get("host");
    if (!origin || !host || new URL(origin).host !== host) return json(403, { error: "Not allowed" });
    if (!/^application\/json/.test(req.headers.get("content-type") || "")) return json(415, { error: "Not allowed" });
    if (+req.headers.get("content-length") > MAX_BODY) return json(413, { error: "Too much to save at once. Add fewer pictures per save." });
    if (env("CMS_SECRET").length < 32 || !env("CMS_PASSWORD_HASH")) return json(503, { error: "The dashboard is not set up yet." });
    const raw = await req.text(); if (raw.length > MAX_BODY) return json(413, { error: "Too much to save at once. Add fewer pictures per save." });
    let body; try { body = JSON.parse(raw); } catch (e) { return json(400, { error: "Not allowed" }); }
    if (!body || typeof body !== "object") return json(400, { error: "Not allowed" });

    if (body.action === "login") {
      const started = Date.now(), ok = checkPassword(body.password);
      await sleep(Math.max(0, (ok ? 300 : 1200) - (Date.now() - started))); // slows guessing; the password is random and long
      if (!ok) return json(401, { error: "That password is not right." });
      return json(200, makeToken(body.remember === true));
    }
    if (!checkToken(req)) return json(401, { error: "Please sign in again.", signin: true });

    if (body.action === "load") {
      if (!env("CMS_GITHUB_TOKEN")) { const r = await fetch(new URL("/" + FILE, origin)); return json(200, { site: await r.json(), version: null, canSave: false }); }
      const cur = await current(); return json(200, { site: cur.site, version: cur.version, canSave: true });
    }
    if (body.action === "save") return json(200, await save(body));
    return json(400, { error: "Unknown action" });
  } catch (e) {
    if (e.user) return json(e.status || 400, { error: e.message });
    console.error("cms error:", e.message);
    if (e.gh === 401 || e.gh === 403 || e.gh === 404) return json(502, { error: "GitHub refused the save. The GitHub token in Netlify may have expired or lacks access to this repository." });
    return json(500, { error: "Something went wrong while talking to GitHub. Nothing was saved — please try again." });
  }
};
export const config = { path: "/api/cms" };
