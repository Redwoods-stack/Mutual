// Mutual dashboard. Forms are built from cms/schema.mjs; saving posts to /api/cms, which commits to GitHub.
// No content is ever written with innerHTML: everything goes through el(), so text stays text.
import schema from "./schema.mjs";

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (k === "text") n.textContent = v; else n.setAttribute(k, v === true ? "" : v); }
  for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(k));
  return n;
};
const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
const set = (o, path, v) => { const ks = path.split("."); const last = ks.pop(); let a = o; for (const k of ks) { if (a[k] == null) a[k] = {}; a = a[k]; } a[last] = v; };
const clone = (o) => JSON.parse(JSON.stringify(o));

const KEY = "mutual-cms-token";
let token = null, state = null, saved = "", version = null, canSave = false, uploads = {}, previews = {}, section = schema[0].id, busy = false;

/* ---------- talking to the server ---------- */
async function api(action, body = {}) {
  const r = await fetch("/api/cms", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ action, ...body }) });
  let j = {}; try { j = await r.json(); } catch (e) { /* not JSON */ }
  if (r.status === 401 && j.signin) { signOut("Your session ended. Please sign in again."); throw new Error("signin"); }
  if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}
function readToken() {
  for (const st of [localStorage, sessionStorage]) { try { const t = JSON.parse(st.getItem(KEY) || "null"); if (t && t.exp > Date.now() + 60000) return t.token; if (t) st.removeItem(KEY); } catch (e) { /* storage blocked */ } }
  return null;
}
function signOut(msg) {
  token = null; state = null; uploads = {};
  try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  showLogin(msg);
}

/* ---------- sign in ---------- */
function showLogin(msg) {
  document.body.className = "is-login";
  const err = el("p", { class: "err", role: "alert", text: msg || "" });
  const pw = el("input", { type: "password", id: "pw", autocomplete: "current-password", required: true, placeholder: "Password" });
  const keep = el("input", { type: "checkbox", id: "keep" });
  const btn = el("button", { class: "btn", type: "submit", text: "Sign in" });
  const form = el("form", { class: "login", onsubmit: async (e) => {
    e.preventDefault(); err.textContent = ""; btn.disabled = true; btn.textContent = "Signing in…";
    try {
      const r = await api("login", { password: pw.value, remember: keep.checked });
      token = r.token;
      try { (keep.checked ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(r)); } catch (e2) { /* stay signed in for this page only */ }
      await open();
    } catch (e2) { if (e2.message !== "signin") err.textContent = e2.message; btn.disabled = false; btn.textContent = "Sign in"; pw.select(); }
  } },
    el("img", { src: "/assets/logos/mutual-green.png", alt: "Mutual", class: "login-logo" }),
    el("h1", { text: "Dashboard" }),
    el("label", { for: "pw", class: "sr", text: "Password" }), pw,
    el("label", { class: "check" }, keep, " Keep me signed in on this device for 30 days"),
    btn, err);
  $("#app").replaceChildren(form); pw.focus();
}

/* ---------- the editor ---------- */
async function open() {
  document.body.className = "is-loading"; $("#app").replaceChildren(el("p", { class: "loading", text: "Loading the site content…" }));
  const r = await api("load");
  for (const sec of schema) for (const g of sec.groups) for (const f of g.fields) if (f.type === "list") (get(r.site, f.k) || []).forEach((it, i) => { it._k = i; });
  state = r.site; saved = JSON.stringify(state); version = r.version; canSave = r.canSave; uploads = {}; previews = {};
  draw();
}
const dirty = () => state && JSON.stringify(state) !== saved;
function refreshBar() {
  const d = dirty(), s = $("#status"), b = $("#save"); if (!s) return;
  s.textContent = busy ? "Saving…" : d ? "Unsaved changes" : "Everything is saved"; s.className = "status" + (d ? " dirty" : "");
  b.disabled = busy || !d || !canSave;
}
function toast(msg, bad) { const t = el("div", { class: "toast" + (bad ? " bad" : ""), role: "status", text: msg }); document.body.append(t); setTimeout(() => t.remove(), bad ? 9000 : 6000); }

async function save() {
  if (busy || !dirty()) return;
  busy = true; refreshBar();
  try {
    const used = JSON.stringify(state), ups = Object.values(uploads).filter((u) => used.includes("upload:" + u.id));
    const r = await api("save", { version, site: state, uploads: ups });
    if (r.site) { for (const sec of schema) for (const g of sec.groups) for (const f of g.fields) if (f.type === "list") (get(r.site, f.k) || []).forEach((it, i) => { it._k = i; }); state = r.site; }
    if (r.version) version = r.version;
    saved = JSON.stringify(state); uploads = {}; previews = {};
    busy = false; draw();
    toast(r.unchanged ? "Nothing had changed." : "Saved. The site updates by itself in about a minute.");
  } catch (e) { busy = false; refreshBar(); if (e.message !== "signin") toast(e.message, true); }
}

function draw() {
  document.body.className = "is-app";
  const sec = schema.find((s) => s.id === section) || schema[0];
  const nav = el("nav", { class: "side", "aria-label": "Sections" }, schema.map((s) => el("button", { type: "button", class: s.id === sec.id ? "on" : "", onclick: () => { section = s.id; draw(); scrollTo(0, 0); }, text: s.title })));
  const bar = el("header", { class: "bar" },
    el("a", { class: "bar-logo", href: "/admin" }, el("img", { src: "/assets/logos/mutual-green.png", alt: "Mutual" }), el("span", { text: "Dashboard" })),
    el("span", { id: "status", class: "status" }),
    el("a", { class: "ghost", href: "https://www.mutual.golf/", target: "_blank", rel: "noopener", text: "View site" }),
    el("button", { class: "ghost", type: "button", onclick: () => { if (!dirty() || confirm("You have unsaved changes. Sign out anyway?")) signOut(); }, text: "Sign out" }),
    el("button", { id: "save", class: "btn", type: "button", onclick: save, text: "Save changes" }));
  const main = el("main", { class: "main" },
    !canSave && el("p", { class: "notice", text: "Saving is not connected yet. You can look around and edit, but changes cannot be saved until the GitHub token is added in Netlify." }),
    el("h1", { text: sec.title }), el("p", { class: "hint", text: sec.hint }),
    sec.groups.map((g) => el("section", { class: "card" }, el("h2", { text: g.title }), g.fields.map((f) => field(f, state, f.k)))));
  $("#app").replaceChildren(bar, el("div", { class: "cols" }, nav, main));
  refreshBar();
}

/* one field. `host` is the object it lives in (the whole site, or a list item); `path` its key there */
function field(f, host, path) {
  const cur = () => get(host, path), put = (v) => { set(host, path, v); refreshBar(); };
  const id = "f" + Math.random().toString(36).slice(2, 9);
  const wrap = (...kids) => el("div", { class: "field f-" + f.type }, f.type !== "list" && f.type !== "toggle" && el("label", { for: id, text: f.label }), ...kids);
  switch (f.type) {
    case "text": case "url": { const i = el("input", { id, type: f.type === "url" ? "url" : "text", maxlength: f.max || (f.type === "url" ? 300 : 200), value: cur() == null ? "" : cur(), oninput: () => put(i.value) }); return wrap(i); }
    case "area": { const t = el("textarea", { id, maxlength: f.max || 1000, rows: 4, oninput: () => put(t.value) }); t.value = cur() == null ? "" : cur(); return wrap(t); }
    case "lines": { const t = el("textarea", { id, rows: 5, oninput: () => put(t.value.split("\n").map((x) => x.trim()).filter(Boolean)) }); t.value = (cur() || []).join("\n"); return wrap(t); }
    case "pairs": { const t = el("textarea", { id, rows: 4, placeholder: "120+ | players", oninput: () => put(t.value.split("\n").map((x) => x.split("|").map((y) => y.trim())).filter((p) => p.length >= 2 && p[0] && p[1]).map((p) => [p[0], p.slice(1).join(" | ")])) }); t.value = (cur() || []).map((p) => p.join(" | ")).join("\n"); return wrap(t); }
    case "toggle": { const c = el("input", { id, type: "checkbox", onchange: () => put(c.checked) }); c.checked = cur() === true; return el("div", { class: "field f-toggle" }, el("label", { class: "check", for: id }, c, " " + f.label)); }
    case "image": return wrap(picture(id, cur, put));
    case "images": { const n = f.count || 4; return wrap(el("div", { class: "pics" }, Array.from({ length: n }, (_, i) => picture(i ? id + i : id, () => (cur() || [])[i], (v) => { const a = (cur() || []).slice(); a[i] = v; put(a); })))); }
    case "list": return list(f, host, path);
  }
}

function picture(id, cur, put) {
  const src = (v) => !v ? "" : v.startsWith("upload:") ? previews[v.slice(7)] : "/" + v;
  const img = el("img", { alt: "", class: "thumb" }); const note = el("small");
  const show = () => { const v = cur(); if (v) { img.src = src(v); img.hidden = false; } else img.hidden = true; note.textContent = v && v.startsWith("upload:") ? "New picture — not saved yet" : v ? "" : "No picture yet"; };
  const input = el("input", { id, type: "file", accept: "image/jpeg,image/png,image/webp", class: "sr", onchange: async () => {
    const file = input.files[0]; input.value = ""; if (!file) return;
    try { const u = await shrink(file); uploads[u.id] = u; put("upload:" + u.id); show(); } catch (e) { toast(e.message, true); }
  } });
  show();
  return el("div", { class: "pic" }, img, el("div", {}, el("label", { class: "ghost", for: id, text: "Choose picture" }), input, note));
}
// Resize in the browser before upload: at most 1800 px on the long side, JPEG (PNG kept when it has see-through areas and is small).
async function shrink(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Please choose a JPG, PNG or WebP picture.");
  const bmp = await createImageBitmap(file).catch(() => { throw new Error("That file could not be read as a picture."); });
  const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  if (Math.max(bmp.width, bmp.height) < 900) toast("That picture is small (" + bmp.width + " × " + bmp.height + "). It may look soft on the site.", true);
  const c = el("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(bmp, 0, 0, w, h);
  let blob = null;
  if (file.type === "png" || file.type === "image/png") { const p = await new Promise((r) => c.toBlob(r, "image/png")); if (p && p.size < 900 * 1024) blob = p; }
  if (!blob) { const x = c.getContext("2d"); x.globalCompositeOperation = "destination-over"; x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.86)); }
  if (!blob || blob.size > 1.5 * 1024 * 1024) throw new Error("That picture is too large even after resizing. Please try another.");
  const data = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
  const id = Math.random().toString(36).slice(2, 12).padEnd(8, "0").replace(/[^a-z0-9]/g, "0");
  previews[id] = URL.createObjectURL(blob);
  return { id, name: file.name, data };
}

function list(f, host, path) {
  const box = el("div", { class: "list" });
  const items = () => get(host, path) || [];
  const redraw = (openIdx) => { box.replaceChildren(...render(openIdx)); refreshBar(); };
  const render = (openIdx) => {
    const arr = items(), canEdit = f.add || f.remove || f.sort;
    const rows = arr.map((it, i) => {
      const title = el("span", { class: "it-title", text: String(it[f.itemLabel] || "Untitled") });
      const body = el("div", { class: "it-body" }, f.fields.map((sub) => field(sub, it, sub.k)));
      body.addEventListener("input", () => { title.textContent = String(it[f.itemLabel] || "Untitled"); });
      const tools = canEdit && el("span", { class: "it-tools" },
        f.sort && el("button", { type: "button", title: "Move up", "aria-label": "Move up", disabled: i === 0, onclick: (e) => { e.preventDefault(); arr.splice(i - 1, 0, arr.splice(i, 1)[0]); redraw(); }, text: "↑" }),
        f.sort && el("button", { type: "button", title: "Move down", "aria-label": "Move down", disabled: i === arr.length - 1, onclick: (e) => { e.preventDefault(); arr.splice(i + 1, 0, arr.splice(i, 1)[0]); redraw(); }, text: "↓" }),
        f.remove && el("button", { type: "button", class: "rm", title: "Remove", "aria-label": "Remove", onclick: (e) => { e.preventDefault(); if (confirm("Remove “" + (it[f.itemLabel] || "this item") + "”?")) { arr.splice(i, 1); redraw(); } }, text: "Remove" }));
      const d = el("details", { class: "item" }, el("summary", {}, title, it.hidden && el("em", { text: "hidden" }), it.featured && el("em", { text: "featured" }), tools), body);
      if (i === openIdx) d.open = true;
      return d;
    });
    const add = f.add && arr.length < (f.max || 40) && el("button", { type: "button", class: "ghost add", onclick: () => { const it = {}; for (const sub of f.fields) if (sub.type === "text" || sub.type === "area") it[sub.k] = ""; arr.push(it); if (!get(host, path)) set(host, path, arr); redraw(arr.length - 1); }, text: "+ " + f.add });
    return [...rows, add].filter(Boolean);
  };
  box.append(...render());
  return el("div", { class: "field f-list" }, box);
}

addEventListener("beforeunload", (e) => { if (dirty()) { e.preventDefault(); e.returnValue = ""; } });
addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "s" && state) { e.preventDefault(); save(); } });
if (top !== self) document.body.textContent = ""; // never run inside someone else's frame
else { token = readToken(); if (token) open().catch((e) => { if (e.message !== "signin") signOut(e.message); }); else showLogin(); }
