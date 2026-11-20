// Mutual dashboard. Forms are built from cms/schema.mjs; saving posts to /api/cms, which commits to GitHub.
// Layout: icon sidebar · overview page · picture cards for anything with a photo · slide-in panel to edit one item.
// No content is ever written with innerHTML (only the fixed icon drawings below): everything goes through el(), so text stays text.
import schema from "./schema.mjs";

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (k === "text") n.textContent = v; else n.setAttribute(k, v === true ? "" : v); }
  for (const k of kids.flat(3)) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(k));
  return n;
};
const ICONS = { // fixed drawings, 20×20, hairline
  overview: '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/>',
  home: '<path d="M3.5 9.5 10 4l6.5 5.5V16a.5.5 0 0 1-.5.5h-3.5v-4h-5v4H4a.5.5 0 0 1-.5-.5z"/>',
  programs: '<rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="m8.5 8 3.5 2-3.5 2z"/>',
  events: '<rect x="3" y="4.5" width="14" height="12" rx="2"/><path d="M3 8.5h14M7 3v3M13 3v3"/>',
  products: '<path d="M5 7h10l-.8 9.5H5.8z"/><path d="M7.5 7V6a2.5 2.5 0 0 1 5 0v1"/>',
  collab: '<circle cx="7" cy="8" r="2.5"/><circle cx="13.5" cy="8.5" r="2"/><path d="M2.5 16c.4-2.6 2.2-4 4.5-4s4.100 1.400 4.500 4M12.500 12.200c2.300-.3 4.300 1 4.900 3.300"/>',
  about: '<circle cx="10" cy="10" r="7"/><path d="M10 9v4.500M10 6.500v.2"/>',
  contact: '<path d="M4 4.500h12a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V5.500a1 1 0 0 1 1-1z"/>',
  ext: '<path d="M8 5H5v10h10v-3M11 4.500h4.500V9M15 5l-6 6"/>', out: '<path d="M8 4H4.500v12H8M12.500 6.500 16 10l-3.500 3.500M16 10H8"/>',
  up: '<path d="M10 15V5M6 9l4-4 4 4"/>', left: '<path d="M15 10H5M9 6l-4 4 4 4"/>', right: '<path d="M5 10h10M11 6l4 4-4 4"/>',
  photo: '<rect x="3" y="4" width="14" height="12" rx="2"/><circle cx="7.500" cy="8.500" r="1.200"/><path d="m4 14 4-3.500 3 2.500 2.500-2 3.500 3"/>', close: '<path d="m5 5 10 10M15 5 5 15"/>', plus: '<path d="M10 4.500v11M4.500 10h11"/>'
};
const ico = (name) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 20 20"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", "ico"); s.innerHTML = ICONS[name] || ""; return s; };
const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
const set = (o, path, v) => { const ks = path.split("."); const last = ks.pop(); let a = o; for (const k of ks) { if (a[k] == null) a[k] = {}; a = a[k]; } a[last] = v; };

const KEY = "mutual-cms-token", THEME = "mutual-cms-theme";
let token = null, state = null, saved = "", version = null, canSave = false, uploads = {}, previews = {}, section = "overview", busy = false, drawer = null, videos = null;
try { document.documentElement.dataset.theme = localStorage.getItem(THEME) === "light" ? "light" : "dark"; } catch (e) { document.documentElement.dataset.theme = "dark"; }

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
  token = null; state = null; uploads = {}; closeDrawer(true);
  try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  showLogin(msg);
}

/* ---------- sign in ---------- */
function showLogin(msg) {
  document.body.className = "is-login";
  const err = el("p", { class: "err", role: "alert", text: msg || "" });
  const pw = el("input", { type: "password", id: "pw", autocomplete: "current-password", required: true, placeholder: "Password" });
  const keep = el("input", { type: "checkbox", id: "keep" });
  const btn = el("button", { class: "btn wide", type: "submit", text: "Sign in" });
  const form = el("form", { class: "login-form", onsubmit: async (e) => {
    e.preventDefault(); err.textContent = ""; btn.disabled = true; btn.textContent = "Signing in…";
    try {
      const r = await api("login", { password: pw.value, remember: keep.checked });
      token = r.token;
      try { (keep.checked ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(r)); } catch (e2) { /* stay signed in for this page only */ }
      await open();
    } catch (e2) { if (e2.message !== "signin") err.textContent = e2.message; btn.disabled = false; btn.textContent = "Sign in"; pw.select(); }
  } },
    el("img", { src: "/assets/logos/mutual-white.png", alt: "Mutual", class: "login-logo" }),
    el("p", { class: "eyebrow", text: "Dashboard" }),
    el("h1", {}, "Welcome ", el("i", { text: "back" })),
    el("p", { class: "login-sub", text: "Sign in to edit what’s on mutual.golf." }),
    el("label", { for: "pw", class: "sr", text: "Password" }), pw,
    el("label", { class: "switch" }, keep, el("span", { class: "sw" }), el("span", { text: "Keep me signed in on this device for 30 days" })),
    btn, err);
  $("#app").replaceChildren(el("div", { class: "login" }, el("div", { class: "login-side" }, form),
    el("div", { class: "login-art" }, el("img", { src: "/assets/video/showreel-poster.jpg", alt: "" }), el("p", {}, "The new culture ", el("i", { text: "of golf" })))));
  pw.focus();
}

/* ---------- loading and saving ---------- */
const lists = () => schema.flatMap((s) => s.groups.flatMap((g) => g.fields.filter((f) => f.type === "list")));
const stamp = (site) => { for (const f of lists()) (get(site, f.k) || []).forEach((it, i) => { it._k = i; }); return site; };
async function open() {
  document.body.className = "is-loading"; $("#app").replaceChildren(el("p", { class: "loading", text: "Loading the site content…" }));
  const r = await api("load");
  state = stamp(r.site); saved = JSON.stringify(state); version = r.version; canSave = r.canSave; uploads = {}; previews = {};
  draw();
  fetch("/api/videos").then((x) => (x.ok ? x.json() : null)).then((v) => { if (v && v.latest) { videos = v.latest; if (section === "overview" && state) draw(); } }).catch(() => {});
}
const dirty = () => state && JSON.stringify(state) !== saved;
function refreshBar() {
  const d = dirty(), s = $("#status"), b = $("#save"); if (!s) return;
  s.textContent = busy ? "Saving…" : d ? "Unsaved changes" : "All changes saved"; s.className = "status" + (d ? " dirty" : "");
  b.disabled = busy || !d || !canSave; b.textContent = busy ? "Saving…" : "Save changes";
  const x = $("#discard"); if (x) x.hidden = !d || busy;
}
function toast(msg, bad) { const t = el("div", { class: "toast" + (bad ? " bad" : ""), role: "status", text: msg }); document.body.append(t); setTimeout(() => t.remove(), bad ? 9000 : 6000); }
async function save() {
  if (busy || !dirty()) return;
  closeDrawer(true); busy = true; refreshBar();
  try {
    const used = JSON.stringify(state), ups = Object.values(uploads).filter((u) => used.includes("upload:" + u.id));
    const r = await api("save", { version, site: state, uploads: ups });
    if (r.site) state = stamp(r.site);
    if (r.version) version = r.version;
    saved = JSON.stringify(state); uploads = {}; previews = {};
    busy = false; draw();
    toast(r.unchanged ? "Nothing had changed." : "Saved. The site updates by itself in about a minute.");
  } catch (e) { busy = false; refreshBar(); if (e.message !== "signin") toast(e.message, true); }
}
function discard() { if (!confirm("Discard all unsaved changes?")) return; closeDrawer(true); state = JSON.parse(saved); uploads = {}; previews = {}; draw(); }

/* ---------- pictures ---------- */
const srcOf = (v) => !v ? "" : String(v).startsWith("upload:") ? previews[v.slice(7)] : "/" + v;
const thumbOf = (it) => it.img || it.banner || (Array.isArray(it.images) && it.images[0]) || (Array.isArray(it.gallery) && it.gallery[0]) || "";
const subOf = (it) => [it.date, it.tag].filter(Boolean).join(" · ") || it.short || it.sub || it.serif || "";
const flagsOf = (it) => [it.featured && "Featured", it.hidden && "Hidden", it.home && "On homepage"].filter(Boolean);
// Resize in the browser before upload: at most 1800 px on the long side, JPEG (small PNGs keep their see-through areas).
async function shrink(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Please choose a JPG, PNG or WebP picture.");
  const bmp = await createImageBitmap(file).catch(() => { throw new Error("That file could not be read as a picture."); });
  const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  if (Math.max(bmp.width, bmp.height) < 900) toast("That picture is small (" + bmp.width + " × " + bmp.height + "). It may look soft on the site.", true);
  const c = el("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(bmp, 0, 0, w, h);
  let blob = null;
  if (file.type === "image/png") { const p = await new Promise((r) => c.toBlob(r, "image/png")); if (p && p.size < 900 * 1024) blob = p; }
  if (!blob) { const x = c.getContext("2d"); x.globalCompositeOperation = "destination-over"; x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.86)); }
  if (!blob || blob.size > 1.5 * 1024 * 1024) throw new Error("That picture is too large even after resizing. Please try another.");
  const data = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
  const id = Math.random().toString(36).slice(2, 12).padEnd(8, "0").replace(/[^a-z0-9]/g, "0");
  previews[id] = URL.createObjectURL(blob);
  return { id, name: file.name, data };
}
function picture(id, cur, put, small) {
  const img = el("img", { alt: "" }), empty = el("span", { class: "pic-empty" }, ico("photo"), el("span", { text: "Drop a picture here, or click to choose" })), note = el("small");
  const show = () => { const v = cur(); img.hidden = !v; empty.hidden = !!v; if (v) img.src = srcOf(v); note.textContent = v && String(v).startsWith("upload:") ? "New picture — goes live when you save" : v ? "Click or drop a picture to replace" : ""; };
  const take = async (file) => { if (!file) return; try { const u = await shrink(file); uploads[u.id] = u; put("upload:" + u.id); show(); } catch (e) { toast(e.message, true); } };
  const input = el("input", { id, type: "file", accept: "image/jpeg,image/png,image/webp", class: "sr", onchange: () => { const f = input.files[0]; input.value = ""; take(f); } });
  const zone = el("label", { class: "pic" + (small ? " small" : ""), for: id,
    ondragover: (e) => { e.preventDefault(); zone.classList.add("over"); }, ondragleave: () => zone.classList.remove("over"),
    ondrop: (e) => { e.preventDefault(); zone.classList.remove("over"); take(e.dataTransfer.files[0]); } }, img, empty);
  show();
  return el("div", { class: "pic-wrap" }, zone, input, note);
}

/* ---------- one field. `host` is the object it lives in (the whole site, or a list item); `path` its key there ---------- */
function field(f, host, path) {
  const cur = () => get(host, path), put = (v) => { set(host, path, v); refreshBar(); };
  const id = "f" + Math.random().toString(36).slice(2, 9);
  const count = (input, max) => { const c = el("span", { class: "count" }); const up = () => { const n = input.value.length; c.textContent = n > max * 0.8 ? n + " / " + max : ""; }; input.addEventListener("input", up); up(); return c; };
  const wrap = (input, max) => el("div", { class: "field f-" + f.type }, el("label", { for: id }, f.label, max && count(input, max)), input);
  switch (f.type) {
    case "text": case "url": { const max = f.max || (f.type === "url" ? 300 : 200); const i = el("input", { id, type: f.type === "url" ? "url" : "text", maxlength: max, value: cur() == null ? "" : cur(), placeholder: f.type === "url" ? "https://" : null, oninput: () => put(i.value) }); return wrap(i, f.type === "url" ? 0 : max); }
    case "area": { const max = f.max || 1000; const t = el("textarea", { id, maxlength: max, rows: 4, oninput: () => put(t.value) }); t.value = cur() == null ? "" : cur(); return wrap(t, max); }
    case "lines": { const t = el("textarea", { id, rows: 5, oninput: () => put(t.value.split("\n").map((x) => x.trim()).filter(Boolean)) }); t.value = (cur() || []).join("\n"); return wrap(t); }
    case "pairs": { const t = el("textarea", { id, rows: 4, placeholder: "120+ | players", oninput: () => put(t.value.split("\n").map((x) => x.split("|").map((y) => y.trim())).filter((p) => p.length >= 2 && p[0] && p[1]).map((p) => [p[0], p.slice(1).join(" | ")])) }); t.value = (cur() || []).map((p) => p.join(" | ")).join("\n"); return wrap(t); }
    case "toggle": { const c = el("input", { id, type: "checkbox", onchange: () => put(c.checked) }); c.checked = cur() === true; return el("div", { class: "field f-toggle" }, el("label", { class: "switch", for: id }, c, el("span", { class: "sw" }), el("span", { text: f.label }))); }
    case "image": return el("div", { class: "field f-image" }, el("span", { class: "lab", text: f.label }), picture(id, cur, put));
    case "images": { const n = f.count || 4; return el("div", { class: "field f-images" }, el("span", { class: "lab", text: f.label }), el("div", { class: "pics" }, Array.from({ length: n }, (_, i) => picture(id + i, () => (cur() || [])[i], (v) => { const a = (cur() || []).slice(); a[i] = v; put(a); }, true)))); }
    case "list": return f.fields.some((x) => x.type === "image" || x.type === "images") ? gallery(f, host, path) : inlineList(f, host, path);
  }
}
// short lists without pictures (numbers, links, text cards): edited right on the page
function inlineList(f, host, path) {
  const arr = get(host, path) || [];
  return el("div", { class: "tiles n" + Math.min(arr.length, 4) }, arr.map((it) => el("div", { class: "tile" }, f.itemLabel === "k" && el("p", { class: "tile-k", text: String(it.k || "") }), f.fields.map((sub) => field(sub, it, sub.k)))));
}
// lists with pictures: a wall of cards; click one to edit it in the side panel
function gallery(f, host, path) {
  const box = el("div", { class: "cards" });
  const paint = () => {
    const arr = get(host, path) || [], can = f.add || f.remove || f.sort;
    box.replaceChildren(...arr.map((it, i) => {
      const t = thumbOf(it), flags = flagsOf(it);
      const move = (d) => (e) => { e.stopPropagation(); arr.splice(i + d, 0, arr.splice(i, 1)[0]); paint(); refreshBar(); };
      return el("div", { class: "mcard" + (it.hidden ? " is-hidden" : ""), role: "button", tabindex: "0", onclick: () => openDrawer(f, arr, it, paint), onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDrawer(f, arr, it, paint); } } },
        el("div", { class: "mthumb" }, t ? el("img", { src: srcOf(t), alt: "", loading: "lazy" }) : el("span", { class: "nothumb" }, ico("photo")),
          can && f.sort && el("span", { class: "mmove" }, el("button", { type: "button", title: "Move earlier", "aria-label": "Move earlier", disabled: i === 0, onclick: move(-1) }, ico("left")), el("button", { type: "button", title: "Move later", "aria-label": "Move later", disabled: i === arr.length - 1, onclick: move(1) }, ico("right")))),
        el("div", { class: "mbody" }, flags.length > 0 && el("p", { class: "mflag", text: flags.join(" · ") }), el("h3", { text: String(it[f.itemLabel] || "Untitled") }), el("p", { class: "msub", text: subOf(it) })));
    }), f.add && arr.length < (f.max || 40) && el("button", { type: "button", class: "mcard madd", onclick: () => { const it = {}; for (const sub of f.fields) if (sub.type === "text" || sub.type === "area") it[sub.k] = ""; arr.push(it); if (!get(host, path)) set(host, path, arr); paint(); refreshBar(); openDrawer(f, arr, it, paint); } }, ico("plus"), el("span", { text: f.add })));
  };
  paint();
  return el("div", { class: "field f-list" }, box);
}

/* ---------- the side panel ---------- */
function closeDrawer(silent) { if (!drawer) return; const d = drawer; drawer = null; d.node.remove(); document.body.classList.remove("has-drawer"); if (!silent && d.after) d.after(); }
function openDrawer(f, arr, it, after) {
  closeDrawer(true);
  const title = el("h2", { text: String(it[f.itemLabel] || "New item") });
  const body = el("div", { class: "dbody" }, f.fields.map((sub) => field(sub, it, sub.k)));
  body.addEventListener("input", () => { title.textContent = String(it[f.itemLabel] || "New item"); });
  const panel = el("aside", { class: "drawer", role: "dialog", "aria-modal": "true", "aria-label": "Edit" },
    el("header", {}, el("div", {}, el("p", { class: "eyebrow", text: "Editing" }), title), el("button", { type: "button", class: "iconbtn", "aria-label": "Close", onclick: () => closeDrawer() }, ico("close"))),
    body,
    el("footer", {}, f.remove && el("button", { type: "button", class: "link danger", onclick: () => { if (confirm("Remove “" + (it[f.itemLabel] || "this item") + "” from the site?")) { arr.splice(arr.indexOf(it), 1); refreshBar(); closeDrawer(); } }, text: "Remove" }),
      el("button", { type: "button", class: "btn", onclick: () => closeDrawer(), text: "Done" })));
  const node = el("div", { class: "scrim", onclick: (e) => { if (e.target === node) closeDrawer(); } }, panel);
  drawer = { node, after }; document.body.append(node); document.body.classList.add("has-drawer");
  const first = $("input,textarea", body); if (first && innerWidth > 820) first.focus();
}

/* ---------- pages ---------- */
function overview() {
  const P = state.programs, nProg = P.youtube.length + P.vertical.length + P.editorial.length, shown = state.products.filter((p) => !p.hidden), feat = state.products.find((p) => p.featured && !p.hidden);
  const go = (id) => () => { section = id; draw(); scrollTo(0, 0); };
  const kpi = (n, label, id) => el("button", { type: "button", class: "kpi", onclick: go(id) }, el("b", { text: String(n) }), el("span", { text: label }));
  const tile = (id, img, title, line) => el("button", { type: "button", class: "otile", onclick: go(id) }, el("div", { class: "oimg" }, img ? el("img", { src: srcOf(img), alt: "", loading: "lazy" }) : el("span", { class: "nothumb" }, ico(id))), el("div", { class: "obody" }, el("h3", { text: title }), el("p", { text: line })));
  return [
    el("div", { class: "kpis" }, kpi(nProg, "programs", "programs"), kpi(state.events.length, "events", "events"), kpi(shown.length, "products shown", "products"), kpi(state.cases.length, "case studies", "collab")),
    el("h2", { class: "sech", text: "Edit the site" }),
    el("div", { class: "otiles" },
      tile("home", "assets/video/showreel-poster.jpg", "Homepage", "“" + state.brand.intro_title + "”"),
      tile("programs", P.youtube[0] && P.youtube[0].img, "Programs", P.youtube.length + " YouTube shows · " + P.vertical.length + " vertical · " + P.editorial.length + " editorial"),
      tile("events", thumbOf(state.events[0] || {}), "Events", state.events.filter((e) => e.home).length + " of " + state.events.length + " on the homepage"),
      tile("products", feat ? thumbOf({ banner: feat.banner, img: feat.img }) : thumbOf(shown[0] || {}), "Products", feat ? "Featured: " + feat.name : "No featured product"),
      tile("collab", thumbOf(state.cases[0] || {}), "Collaborations", state.collab.brands_count + " brands · " + state.collab.courses_count + " partner courses"),
      tile("about", thumbOf((state.about.pillars || [])[0] || {}), "About", "Three pillars" + (state.about.show_ecosystem ? " · ecosystem shown" : "")),
      tile("contact", "", "Contact & socials", "WhatsApp " + (state.brand.whatsapp_display || "not set"))),
    videos && el("h2", { class: "sech" }, "Latest on YouTube ", el("small", { text: "updates by itself — nothing to edit" })),
    videos && el("div", { class: "vrow" }, videos.slice(0, 4).map((v) => el("a", { class: "vcard", href: "https://www.youtube.com/watch?v=" + encodeURIComponent(v.id), target: "_blank", rel: "noopener" }, el("img", { src: "https://i.ytimg.com/vi/" + encodeURIComponent(v.id) + "/mqdefault.jpg", alt: "", loading: "lazy" }), el("span", { text: v.title }))))
  ];
}
function draw() {
  closeDrawer(true); document.body.className = "is-app";
  const sec = schema.find((s) => s.id === section), isOver = !sec;
  const counts = { programs: state.programs.youtube.length + state.programs.vertical.length + state.programs.editorial.length, events: state.events.length, products: state.products.length };
  const nav = (id, title, n) => el("button", { type: "button", class: "nav" + (section === id ? " on" : ""), "aria-current": section === id ? "page" : null, onclick: () => { if (section === id) return; section = id; draw(); scrollTo(0, 0); } }, ico(id), el("span", { text: title }), n != null && el("em", { text: String(n) }));
  const theme = (t, label) => el("button", { type: "button", class: document.documentElement.dataset.theme === t ? "on" : "", onclick: () => { document.documentElement.dataset.theme = t; try { localStorage.setItem(THEME, t); } catch (e) { /* ignore */ } draw(); }, text: label });
  const side = el("aside", { class: "side" },
    el("a", { class: "brand", href: "/admin" }, el("img", { src: "/assets/logos/mutual-white.png", alt: "Mutual", class: "lg-dark" }), el("img", { src: "/assets/logos/mutual-green.png", alt: "Mutual", class: "lg-light" }), el("span", { text: "Dashboard" })),
    el("nav", { "aria-label": "Sections" }, nav("overview", "Overview"),
      el("p", { class: "group", text: "Content" }), schema.map((s) => nav(s.id, s.title, counts[s.id])),
      el("p", { class: "group", text: "Site" }), el("a", { class: "nav", href: "https://www.mutual.golf/", target: "_blank", rel: "noopener" }, ico("ext"), el("span", { text: "Live site" }))),
    el("div", { class: "side-foot" }, el("p", { class: "group", text: "Appearance" }), el("div", { class: "seg" }, theme("dark", "Dark"), theme("light", "Light")),
      el("button", { type: "button", class: "nav", onclick: () => { if (!dirty() || confirm("You have unsaved changes. Sign out anyway?")) signOut(); } }, ico("out"), el("span", { text: "Sign out" }))));
  const top = el("header", { class: "top" },
    el("div", { class: "top-t" }, el("p", { class: "eyebrow", text: "Mutual · www.mutual.golf" }), el("h1", { text: isOver ? "Overview" : sec.title })),
    el("div", { class: "top-a" }, el("span", { id: "status", class: "status" }), el("button", { id: "discard", class: "link", type: "button", onclick: discard, text: "Discard", hidden: true }), el("button", { id: "save", class: "btn", type: "button", onclick: save, text: "Save changes" })));
  const main = el("main", { class: "main" }, top,
    !canSave && el("p", { class: "notice", text: "Saving is not connected yet. You can look around and edit, but changes cannot be saved until the GitHub token is added in Netlify." }),
    isOver ? overview() : [el("p", { class: "hint", text: sec.hint }), sec.groups.map((g) => el("section", { class: "block" }, el("h2", { class: "sech", text: g.title }), g.fields.map((f) => field(f, state, f.k))))]);
  $("#app").replaceChildren(el("div", { class: "shell" }, side, main));
  const on = $(".side .nav.on"); if (on && innerWidth <= 820) on.scrollIntoView({ inline: "center", block: "nearest" });
  refreshBar();
}

addEventListener("beforeunload", (e) => { if (dirty()) { e.preventDefault(); e.returnValue = ""; } });
addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer) closeDrawer(); if ((e.metaKey || e.ctrlKey) && e.key === "s" && state) { e.preventDefault(); save(); } });
if (top !== self) document.body.textContent = ""; // never run inside someone else's frame
else { token = readToken(); if (token) open().catch((e) => { if (e.message !== "signin") signOut(e.message); }); else showLogin(); }
