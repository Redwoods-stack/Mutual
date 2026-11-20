// Applies what the dashboard sent onto the current data/site.json — ONLY the fields listed in cms/schema.mjs,
// each one checked. Anything else the browser sends is ignored; anything else in the file is kept untouched.
// Pure (no network), so it is tested on its own: scripts/cms-test.mjs.
import schema from "./schema.mjs";

const IMG = /^assets\/[A-Za-z0-9][A-Za-z0-9_\-./]*\.(jpe?g|png|webp)$/i;
const URL_OK = /^(https:\/\/|\/)[^\s"'<>\\]*$/;
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\r\n?/g, "\n").trim().slice(0, max);
const fail = (msg) => { const e = new Error(msg); e.user = true; throw e; };

const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
const set = (o, path, v) => { const ks = path.split("."); const last = ks.pop(); let a = o; for (const k of ks) { if (a[k] == null || typeof a[k] !== "object") a[k] = {}; a = a[k]; } a[last] = v; };

function image(v, uploads, label) {
  if (v == null || v === "") return "";
  v = String(v);
  if (v.startsWith("upload:")) { const u = uploads[v.slice(7)]; if (!u) fail(`${label}: the uploaded picture is missing — please choose it again.`); return u; }
  if (!IMG.test(v) || v.includes("..")) fail(`${label}: that is not a picture from this site.`);
  return v;
}

function value(f, v, old, uploads, label) {
  switch (f.type) {
    case "text": { const s = clean(v, f.max || 200).replace(/\n+/g, " "); if (f.required && !s) fail(`${label} cannot be empty.`); if (f.pattern && s && !new RegExp(f.pattern).test(s)) fail(`${label}: “${s}” is not in the right format.`); return s; }
    case "area": return clean(v, f.max || 1000);
    case "url": { const s = clean(v, 300); if (s && !URL_OK.test(s)) fail(`${label} must start with https://`); return s; }
    case "toggle": return v === true;
    case "image": return image(v, uploads, label);
    case "images": { const n = f.count || 4; const a = Array.isArray(v) ? v : []; const o = Array.isArray(old) ? old : []; return Array.from({ length: n }, (_, i) => image(a[i], uploads, label) || o[i] || "").filter(Boolean); }
    case "lines": return (Array.isArray(v) ? v : String(v || "").split("\n")).map((x) => clean(x, 160).replace(/\n+/g, " ")).filter(Boolean).slice(0, f.max || 20);
    case "pairs": return (Array.isArray(v) ? v : []).map((p) => Array.isArray(p) ? [clean(p[0], 16), clean(p[1], 60)] : null).filter((p) => p && p[0] && p[1]).slice(0, f.max || 6);
    case "list": return list(f, v, old, uploads, label);
    default: fail("Unknown field type " + f.type);
  }
}

function list(f, v, old, uploads, label) {
  old = Array.isArray(old) ? old : [];
  if (!Array.isArray(v)) fail(`${label}: expected a list.`);
  const canChange = f.add || f.remove || f.sort;
  if (!canChange && (v.length !== old.length || v.some((it, i) => !it || it._k !== i))) fail(`${label}: items cannot be added, removed or reordered here.`);
  if (v.length > (f.max || 40)) fail(`${label}: at most ${f.max || 40} items.`);
  const used = new Set();
  return v.map((it, i) => {
    if (!it || typeof it !== "object") fail(`${label}: item ${i + 1} is not valid.`);
    let base = {};
    if (Number.isInteger(it._k) && it._k >= 0 && it._k < old.length && !used.has(it._k)) { used.add(it._k); base = JSON.parse(JSON.stringify(old[it._k])); }
    else if (it._k != null) fail(`${label}: item ${i + 1} is not valid.`);
    else if (!f.add) fail(`${label}: new items cannot be added here.`);
    const name = it[f.itemLabel] || base[f.itemLabel] || `item ${i + 1}`;
    for (const sub of f.fields) {
      const val = value(sub, it[sub.k], base[sub.k], uploads, `${label} › ${name} › ${sub.label}`);
      const empty = val === false || val === "" || (Array.isArray(val) && !val.length);
      if (empty && (sub.type === "toggle" || sub.type === "image" || !(sub.k in base))) delete base[sub.k]; else base[sub.k] = val; // no empty clutter in the file
    }
    if (f.rename && Number.isInteger(it._k)) base.__was = old[it._k][f.itemLabel];
    return base;
  });
}

// current = the site.json now in GitHub; sent = what the dashboard posted; uploads = { id: "assets/uploads/…" }
export function apply(current, sent, uploads = {}) {
  if (!sent || typeof sent !== "object") fail("Nothing to save.");
  const out = JSON.parse(JSON.stringify(current));
  for (const sec of schema) for (const g of sec.groups) for (const f of g.fields) {
    const v = get(sent, f.k);
    if (v === undefined) continue;
    set(out, f.k, value(f, v, get(current, f.k), uploads, f.label));
  }
  // only one product may be featured; a featured one needs its banner
  const feat = (out.products || []).filter((p) => p.featured);
  if (feat.length > 1) fail("Only one product can be featured. Untick “Featured” on the others.");
  // an event that was renamed keeps its place in the homepage cards
  const renamed = {};
  for (const e of out.events || []) { if (e.__was && e.__was !== e.name) renamed[e.__was] = e.name; delete e.__was; }
  for (const p of out.pillars || []) if (p.source === "events") for (const it of p.items || []) if (renamed[it.name]) it.name = renamed[it.name];
  return out;
}
export { schema };
