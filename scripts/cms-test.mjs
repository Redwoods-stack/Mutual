// Security and behaviour checks for the dashboard's server side. Needs scripts/cms-dev.mjs running:
//   node scripts/cms-dev.mjs 8090 &   then   node scripts/cms-test.mjs http://localhost:8090
import fs from "node:fs";
import { apply } from "../cms/apply.mjs";
const base = process.argv[2], PW = process.env.CMS_TEST_PASSWORD || "test-password-123";
let pass = 0, failed = 0;
const ok = (name, cond, extra = "") => { if (cond) pass++; else failed++; console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra)); };
const post = async (body, headers = {}) => { const r = await fetch(base + "/api/cms", { method: "POST", headers: { "content-type": "application/json", origin: base, ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }); let j = {}; try { j = await r.json(); } catch (e) { /* */ } return { status: r.status, j, headers: r.headers }; };
const site = JSON.parse(fs.readFileSync(new URL("../data/site.json", import.meta.url)));
const mark = (s) => { for (const k of ["stats", "events", "products", "cases", "work"]) s[k].forEach((it, i) => { it._k = i; }); for (const k of ["youtube", "vertical", "editorial"]) s.programs[k].forEach((it, i) => { it._k = i; }); s.about.pillars.forEach((it, i) => { it._k = i; }); s.brand.socials.forEach((it, i) => { it._k = i; }); return s; };
const fresh = () => mark(JSON.parse(JSON.stringify(site)));
const throws = (fn) => { try { fn(); return ""; } catch (e) { return e.user ? e.message : "NON-USER ERROR " + e.message; } };

// ---- what may be changed (pure checks) ----
{ const s = fresh(); const out = apply(site, s); ok("saving unchanged content changes nothing", JSON.stringify(out) === JSON.stringify(site)); }
{ const s = fresh(); s.brand.intro_title = "New headline"; s.brand.name = "HACKED"; s.pillars = []; s.hero.video = "https://evil.example/x.mp4"; s.newKey = { a: 1 }; s.programs.youtube[0].logo = "https://evil.example/l.png"; s.programs.youtube[0].name = "Renamed";
  const out = apply(site, s);
  ok("a listed field is saved", out.brand.intro_title === "New headline");
  ok("fields that are not editable are ignored (name, video, cards, logos, new keys)", out.brand.name === site.brand.name && out.pillars.length === site.pillars.length && out.hero.video === site.hero.video && !("newKey" in out) && out.programs.youtube[0].logo === site.programs.youtube[0].logo && out.programs.youtube[0].name === site.programs.youtube[0].name); }
{ const s = fresh(); s.brand.intro = "<script>alert(1)</script><img src=x onerror=alert(1)>"; const out = apply(site, s); ok("HTML is stored as plain text (the site escapes it when showing)", out.brand.intro.includes("<script>")); }
{ const s = fresh(); s.events[0].img = "https://evil.example/a.jpg"; ok("a picture from another website is refused", /not a picture from this site/.test(throws(() => apply(site, s)))); }
{ const s = fresh(); s.events[0].img = "assets/../netlify.toml.jpg"; ok("a picture path that climbs out of the site is refused", /not a picture/.test(throws(() => apply(site, s)))); }
{ const s = fresh(); s.events[0].img = "upload:abc12345"; ok("an upload that was not sent is refused", /uploaded picture is missing/.test(throws(() => apply(site, s)))); }
{ const s = fresh(); s.brand.socials[0].url = "javascript:alert(1)"; ok("a javascript: link is refused", /must start with https/.test(throws(() => apply(site, s)))); }
{ const s = fresh(); s.brand.whatsapp = "62813abc"; ok("a WhatsApp number with letters is refused", /right format/.test(throws(() => apply(site, s)))); }
{ const s = fresh(); s.programs.youtube.pop(); ok("programs cannot be removed", /cannot be added, removed/.test(throws(() => apply(site, s)))); }
{ const s = fresh(); s.programs.youtube.push({ name: "X", short: "", text: "" }); ok("programs cannot be added", /cannot be added, removed/.test(throws(() => apply(site, s)))); }
{ const s = fresh(); s.events[1]._k = 0; ok("an item cannot be claimed twice", /not valid/.test(throws(() => apply(site, s)))); }
{ const s = fresh(); for (const p of s.products) p.featured = true; ok("two featured products are refused", /Only one product/.test(throws(() => apply(site, s)))); }
{ const s = fresh(); const was = s.events[2].name; s.events[2].name = "Renamed Show"; s.events.push({ name: "New Event", text: "Hello", date: "2027", home: true }); s.events.splice(0, 1);
  const out = apply(site, s);
  ok("events: rename, add and remove work; logos and other details are kept", out.events.length === site.events.length && out.events[1].name === "Renamed Show" && out.events[1].logo === site.events[2].logo && out.events.at(-1).name === "New Event" && out.events.at(-1).home === true && !("_k" in out.events[0]) && !("__was" in out.events[1]));
  ok("a renamed event keeps its place in the homepage card", JSON.stringify(out.pillars).includes("Renamed Show") && !JSON.stringify(out.pillars).includes(was)); }
{ const s = fresh(); s.brand.intro = "x".repeat(5000); ok("over-long text is cut to its limit", apply(site, s).brand.intro.length === 500); }

// ---- the door (/api/cms) ----
ok("wrong password is refused", (await post({ action: "login", password: "nope" })).status === 401);
{ const t = Date.now(); await post({ action: "login", password: "nope" }); ok("a wrong guess is slowed down (≥ 1 s)", Date.now() - t >= 1000, `${Date.now() - t} ms`); }
ok("a request from another website is refused", (await post({ action: "login", password: PW }, { origin: "https://evil.example" })).status === 403);
ok("a request without an origin is refused", (await fetch(base + "/api/cms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", password: PW }) })).status === 403);
ok("GET is refused", (await fetch(base + "/api/cms", { headers: { origin: base } })).status === 405);
ok("load without signing in is refused", (await post({ action: "load" })).status === 401);
ok("save without signing in is refused", (await post({ action: "save", site: {}, version: "x" })).status === 401);
ok("a made-up token is refused", (await post({ action: "load" }, { authorization: "Bearer eyJleHAiOjk5OTk5OTk5OTk5OTl9.AAAA" })).status === 401);
const login = await post({ action: "login", password: PW });
ok("the right password signs in", login.status === 200 && !!login.j.token && login.headers.get("cache-control") === "no-store");
{ const [p, sig] = login.j.token.split("."); const forged = Buffer.from(JSON.stringify({ exp: Date.now() + 1e12, v: 1 })).toString("base64url") + "." + sig; ok("a token with a changed expiry is refused", (await post({ action: "load" }, { authorization: "Bearer " + forged })).status === 401); }
const auth = { authorization: "Bearer " + login.j.token };
const load = await post({ action: "load" }, auth);
ok("load returns the content", load.status === 200 && load.j.canSave === true && load.j.site.brand.name === site.brand.name);
ok("the response never contains a secret", !JSON.stringify(load.j).includes(process.env.CMS_SECRET || "§") && !JSON.stringify(load.j).includes("local-test-token"));
{ const s = mark(load.j.site); s.brand.intro_title = "Saved by the test"; const r = await post({ action: "save", version: load.j.version, site: s }, auth);
  const now = await (await fetch(base + "/__site")).json(); const log = await (await fetch(base + "/__commits")).json();
  ok("save commits only data/site.json", r.status === 200 && now.brand.intro_title === "Saved by the test" && log.length === 1 && log[0].files.join() === "data/site.json", JSON.stringify(r.j).slice(0, 200));
  const again = await post({ action: "save", version: r.j.version, site: Object.assign(mark(r.j.site), {}) }, auth); ok("saving again with nothing changed makes no commit", again.j.unchanged === true && (await (await fetch(base + "/__commits")).json()).length === 1, JSON.stringify(again.j).slice(0, 200));
  const stale = await post({ action: "save", version: load.j.version, site: s }, auth); ok("saving from an out-of-date copy is refused", stale.status === 409); }
{ const cur = await post({ action: "load" }, auth); const s = mark(cur.j.site); s.events[0].img = "upload:pic0000001";
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const bad = await post({ action: "save", version: cur.j.version, site: s, uploads: [{ id: "pic0000001", name: "x.jpg", data: Buffer.from("<?php echo 1; ?>").toString("base64") }] }, auth); ok("a file that is not a picture is refused", bad.status === 400 && /JPG, PNG or WebP/.test(bad.j.error));
  const good = await post({ action: "save", version: cur.j.version, site: s, uploads: [{ id: "pic0000001", name: "../../My Photo!.PNG", data: png.toString("base64") }] }, auth); const log = await (await fetch(base + "/__commits")).json();
  ok("a picture upload is committed under assets/uploads with a safe name", good.status === 200 && /^assets\/uploads\/my-photo-[0-9a-f]{10}\.png$/.test(good.j.site.events[0].img) && log.at(-1).files.length === 2, JSON.stringify(good.j.site ? good.j.site.events[0].img : good.j)); }
{ const cur = await post({ action: "load" }, auth); await fetch(base + "/__bump"); const s = mark(cur.j.site); s.brand.address = "Elsewhere"; ok("if the site changed meanwhile, the save is refused, not overwritten", (await post({ action: "save", version: cur.j.version, site: s }, auth)).status === 409); }
ok("broken input is refused cleanly", (await post("{not json", auth)).status === 400);
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
