/* Mutual — renders shared header/footer and every content section from data/site.json.
   The CMS (phase 2) edits data/site.json; pages pick the change up on the next deploy. */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NAV = [["Programs", "programs.html"], ["Events", "events.html"], ["Products", "products.html"], ["Collaborations", "collaborations.html"], ["About", "about.html"]];
  const here = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
  const ICON = {
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .6 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.8 31 31 0 0 0-.4-4.8zM9.7 15.1V8.9l5.8 3.1-5.8 3.1z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.4 2.2 1.8 3.7 4 3.9v3.2c-1.5 0-2.9-.4-4-1.2v6.3a6 6 0 1 1-6-6h.6v3.3a2.8 2.8 0 1 0 2.2 2.7V3h3.2z"/></svg>'
  };

  function header() {
    const links = NAV.map(([t, h]) => `<a href="${h}"${h.replace(".html", "") === here ? ' aria-current="page"' : ""}>${t}</a>`).join("");
    return `<header class="site-header"><div class="wrap">
      <a class="brand-logo" href="index.html" aria-label="Mutual — home"><img src="assets/logos/mutual-green.png" alt="Mutual" width="55" height="44"></a>
      <nav class="nav" aria-label="Main">${links}</nav>
      <a class="btn" href="collaborations.html#contact">Let’s collaborate</a>
      <button class="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div></header>
    <div class="mobile-menu" aria-hidden="true">${links}<a class="btn light" href="collaborations.html#contact">Let’s collaborate</a></div>`;
  }

  function footer(S) {
    const b = S.brand;
    return `<footer class="site-footer"><div class="wrap">
      <div class="foot-grid">
        <div><img src="assets/logos/mutual-white.png" alt="Mutual"><p>${esc(b.intro)}</p>
          <div class="socials">${b.socials.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${s.k}">${ICON[s.k] || ""}</a>`).join("")}</div></div>
        <div><h5>Explore</h5><a href="programs.html">Programs</a><a href="events.html">Events</a><a href="products.html">Products</a></div>
        <div><h5>Company</h5><a href="about.html">About</a><a href="collaborations.html">Collaborations</a><a href="collaborations.html#contact">Contact</a></div>
        <div><h5>Say hello</h5><a href="mailto:${esc(b.email)}">${esc(b.email)}</a><a>${esc(b.address)}</a></div>
      </div>
      <div class="foot-bottom"><span>© ${new Date().getFullYear()} The Mutual Golf. All rights reserved.</span><span>${esc(b.group)}</span></div>
    </div></footer>`;
  }

  const allPrograms = (S) => [...S.programs.youtube, ...S.programs.vertical, ...S.programs.editorial].map((p) => p.name);
  const stats = (arr) => arr.map((s) => `<div class="stat"><b>${esc(s.n)}</b><span>${esc(s.l)}</span></div>`).join("");

  /* ---------- sections ---------- */
  const R = {};

  R.hero = (S) => {
    const names = allPrograms(S).concat(["Mutual Major", "Coach Says Live", "Mutual Grounds Market"]);
    const items = names.map((n) => `<span>${esc(n)}</span><i></i>`).join("");
    return `<div class="pattern" aria-hidden="true"></div>
      <div class="ticker" aria-hidden="true"><div class="ticker-track">${items}${items}</div></div>
      <div class="hero-media">
        <video autoplay muted loop playsinline preload="metadata" poster="${esc(S.hero.poster)}">${S.hero.video_mobile ? `<source src="${esc(S.hero.video_mobile)}" type="video/mp4" media="(max-width:760px)">` : ""}<source src="${esc(S.hero.video)}" type="video/mp4"></video>
      </div>
      <div class="ribbon"><div class="wrap"><img src="assets/logos/mutual-green.png" alt="Mutual"><span class="div"></span><p>${esc(S.hero.line)}</p></div></div>`;
  };

  R.intro = (S) => `<section class="sec intro"><div class="wrap">
      <div class="grid rv"><h2 class="h-l">${esc(S.brand.intro_title)}</h2>
        <div><p>${esc(S.brand.intro)}</p><a class="link-arrow" href="programs.html">Explore our programs</a></div></div>
      <div class="eyebrow stats-label rv">The numbers behind the community</div>
      <div class="stats rv">${stats(S.stats)}</div>
    </div></section><div class="wrap"><hr class="hair"></div>`;

  /* "What we make" cards: each card cycles through its programs and the matching logo lights up; hovering or
     tapping a logo picks it. Landscape cards cross-fade one picture; layout "strip" cards (vertical, editorial)
     show three tall pictures side by side, the current one bright, sliding along as it cycles.
     Data: pillars[].items {name, logo, logo_r, logo_note, img}, pillars[].layout. */
  R.make = (S) => `<section class="sec"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">What we make</div><h2 class="h-l">On every screen, <span class="serif">and off it</span></h2></div><a class="link-arrow" href="programs.html">All programs</a></div>
      <div class="cards-2">${S.pillars.map((p) => `<div class="mk rv" data-cycle>
        <a class="mk-img${p.layout === "strip" ? " strip" : ""}" href="${esc(p.href)}" aria-label="${esc(p.title)}">${p.layout === "strip"
          ? `<div class="mk-track">${p.items.map((it, i) => `<div class="mk-slide${i === 0 ? " on" : ""}"><img class="mk-pic" src="${esc(it.img)}" alt="${esc(it.name)}" loading="lazy"></div>`).join("")}</div>`
          : p.items.map((it, i) => `<div class="mk-slide${i === 0 ? " on" : ""}"><img class="mk-pic" src="${esc(it.img)}" alt="${esc(it.name)}" loading="lazy"></div>`).join("")}</a>
        <div class="mk-body"><a class="mk-top" href="${esc(p.href)}"><h3>${esc(p.title)}</h3><span class="circle">→</span></a><p>${esc(p.text)}</p>
        <div class="mk-logos">${p.items.map((it, i) => `<button type="button" class="mk-lg${i === 0 ? " on" : ""}" aria-label="${esc(it.name)}"><img src="${esc(it.logo.replace(".png", "-ink.png"))}" alt="" style="width:${Math.round(34 * Math.sqrt(it.logo_r || 2))}px">${it.logo_note ? `<i>${esc(it.logo_note)}</i>` : ""}</button>`).join("")}</div></div></div>`).join("")}</div>
    </div></section>`;

  /* program / event logos in place of names (data: logo, logo_r, logo_note). Ink version (-ink.png) on light
     backgrounds, original colours on dark ones. The name stays in the page for screen readers and search. */
  const lgImg = (p, base, ink) => `<img class="nm-logo" src="${esc(ink ? p.logo.replace(".png", "-ink.png") : p.logo)}" alt="${esc(p.name)}" style="width:${Math.round(base * Math.sqrt(p.logo_r || 2))}px">${p.logo_note ? `<i class="nm-note">${esc(p.logo_note)}</i>` : ""}`;
  const nmIn = (p, base) => p.logo ? `<span class="nm-txt">${esc(p.name)}</span><span class="nm-in">${lgImg(p, base, true)}</span>` : esc(p.name);

  R.experience = (S) => {
    const evs = (S.experience_events || []).map((n) => S.events.find((e) => e.name === n)).filter(Boolean);
    return `<section class="exp"><img class="exp-bg" src="assets/img/exp-bg.jpg" alt="" loading="lazy"><div class="wrap">
      <div class="eyebrow rv">Experience</div>
      <h2 class="h-l rv">Off the screen, <span class="serif">onto the course</span></h2>
      <p class="lead rv">Tournaments, a reality show, markets, clinics and community nights — Mutual brings its programs to real courses with real people.</p>
      <div class="exp-grid">${evs.map((e) => `<a class="exp-card rv" href="events.html"><div class="exp-ph"><img src="${esc(e.img)}" alt="${esc(e.name)}" loading="lazy"></div><div class="exp-meta"><span class="nm-dark">${e.logo ? lgImg(e, 64) : esc(e.name)}</span><span class="exp-date">${esc(e.date)} · ${esc(e.tag)}</span></div></a>`).join("")}</div>
      <a class="link-arrow exp-all rv" href="events.html">All events</a>
    </div></section>`;
  };


  R.videos = (S) => `<section class="sec"><div class="wrap">
      <div class="sec-head rv"><div class="eyebrow">Our YouTube shows</div><a class="link-arrow" href="programs.html#youtube">See all</a></div>
      <div class="shelf">${S.programs.youtube.slice(0, 8).map((p) => `<a class="vid rv" href="programs.html#youtube"><div class="thumb"><img src="${esc(p.img)}" alt="" loading="lazy"></div><div class="nm-body"><small>${esc(p.short)}</small><h4>${nmIn(p, 62)}</h4></div></a>`).join("")}</div>
    </div></section><div class="wrap"><hr class="hair"></div>`;

  R.reels = (S) => `<section class="sec reels"><div class="wrap">
      <div class="rv"><div class="eyebrow">Vertical series</div><h2 class="h-l">Golf in under <span class="serif">a minute.</span></h2><p>Snackable series for Instagram and TikTok — quick, sharp and made to be shared.</p><a class="link-arrow" href="programs.html#vertical">All vertical series</a></div>
      <div class="reel-row">${S.programs.vertical.map((p) => `<div class="reel rv"><div class="r-img"><img src="${esc(p.img)}" alt="" loading="lazy"></div><div class="nm-body"><b>${nmIn(p, 50)}</b><span>${esc(p.short)}</span></div></div>`).join("")}</div>
    </div></section>`;

  R.products = (S) => `<section class="sec" style="background:var(--cream)"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Mutual products</div><h2 class="h-l">We celebrate golf <span class="serif">beyond the sport</span></h2></div><a class="link-arrow" href="products.html">See products</a></div>
      ${prodGrid(S, 3)}</div></section>`;
  const prodGrid = (S, n) => `<div class="prod-grid">${S.products.slice(0, n || 99).map((p) => `<div class="prod rv"><div class="p-img${/card/i.test(p.img) ? " contain" : ""}"><img src="${esc(p.img)}" alt="" loading="lazy"></div><div class="p-body"><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p></div></div>`).join("")}</div>`;

  R.collab = (S, opts) => `<section class="sec collab"><div class="wrap">
      <div class="sec-head rv"><div><div class="eyebrow">Collaborations</div><h2 class="h-l">Brands we’ve worked with</h2></div>${opts && opts.full ? "" : '<a class="link-arrow" href="collaborations.html">See case studies</a>'}</div>
      <div class="collab-nums rv">${stats([{ n: S.collab.brands_count, l: "brands in our community" }, { n: S.collab.courses_count, l: "partner courses" }])}</div>
      <div class="logo-panels rv"><div class="lp"><img src="assets/img/logos-courses-wide.jpg" alt="Course collaborators" loading="lazy"></div>
        <div class="lp stack"><img src="assets/img/logos-brand.jpg" alt="Brand collaborators" loading="lazy"></div></div>
      <div class="cases">${S.cases.map((c) => `<div class="case rv"><div class="c-img"><img src="${esc(c.img)}" alt="" loading="lazy"></div><b>${esc(c.name)}</b><span>${esc(c.sub)}</span>${opts && opts.full ? `<p style="font-size:14px;color:rgba(255,255,255,.8);margin-top:8px">${esc(c.text)}</p>` : ""}</div>`).join("")}</div>
      <div class="chips rv">${S.collab.partners.map((p) => `<span>${esc(p)}</span>`).join("")}</div>
    </div></section>`;

  R.work = (S) => `<section class="sec" id="work"><div class="wrap">
      <div class="eyebrow rv">Collaboration</div><h2 class="h-l rv" style="margin-top:10px">Work with Mutual</h2>
      <div class="work-grid">${S.work.map((w) => `<div class="work rv"><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p><a class="btn light" href="collaborations.html#contact">Send a brief</a></div>`).join("")}</div>
    </div></section>`;

  /* inner pages */
  const pageHero = (eyebrow, title, text, tabs) => `<section class="page-hero"><div class="wrap"><div class="eyebrow">${eyebrow}</div><h1 class="h-xl">${title}</h1><p>${text}</p>${tabs ? `<div class="tabs">${tabs.map(([t, h]) => `<a href="${h}">${t}</a>`).join("")}</div>` : ""}</div></section>`;
  const progCards = (list, cls, tall) => `<div class="prog-list ${cls || ""}">${list.map((p) => `<div class="prog rv${tall ? " tall" : ""}"><div class="pg-img"><img src="${esc(p.img)}" alt="" loading="lazy"></div><div class="nm-body"><h3>${nmIn(p, tall ? 78 : 104)}</h3><div class="short">${esc(p.short)}</div><p>${esc(p.text)}</p></div></div>`).join("")}</div>`;

  R.programsPage = (S) => pageHero("Programs", "Stories from <span class='serif'>every side</span> of golf", "Video-based programs that show the many sides of golf — diverse, true to the spirit of the game, and open to people outside the golf circle.", [["YouTube shows", "#youtube"], ["Vertical series", "#vertical"], ["Feed & editorial", "#editorial"]]) +
    `<section class="sec" id="youtube"><div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Long-form</div><h2 class="h-l">YouTube shows</h2></div></div>${progCards(S.programs.youtube)}</div></section>
     <section class="sec" id="vertical" style="background:var(--cream)"><div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Short-form</div><h2 class="h-l">Vertical series</h2></div></div>${progCards(S.programs.vertical, "five", true)}</div></section>
     <section class="sec" id="editorial"><div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">Feed</div><h2 class="h-l">Feed & editorial</h2></div></div>${progCards(S.programs.editorial, "four", true)}</div></section>`;

  R.eventsPage = (S) => pageHero("Events", "Off the screen, <span class='serif'>onto the course</span>", "Tournaments, a reality show, markets, clinics and community nights — organised, produced and filmed by Mutual.") +
    `<section class="sec"><div class="wrap">${S.events.map((e) => `<article class="ev rv"><div class="ev-img"><img src="${esc(e.img)}" alt="${esc(e.name)}" loading="lazy"></div><div class="nm-body"><span class="tag">${esc(e.tag)}</span><h3>${nmIn(e, 150)}</h3><div class="meta">${esc(e.date)} · ${esc(e.place)}</div><p>${esc(e.text)}</p>${e.stats.length ? `<div class="ev-stats">${e.stats.map((s) => `<div><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join("")}</div>` : ""}</div></article>`).join("")}</div></section>` + R.work(S);

  R.productsPage = (S) => pageHero("Products", "We celebrate golf <span class='serif'>beyond the sport</span>", "Merchandise, membership and activations that take the Mutual lifestyle from the course to the city.") +
    `<section class="sec"><div class="wrap">${prodGrid(S)}</div></section>`;

  R.collabPage = (S) => pageHero("Collaborations", "Brands already <span class='serif'>trust our community</span>", "130+ brands have worked with our community — banks, telco, FMCG, retail, F&B, fashion, media and tech. Here is what we make together.") +
    R.collab(S, { full: true }) + R.work(S) +
    `<section class="sec" id="contact" style="background:var(--cream)"><div class="wrap"><div class="eyebrow">Contact</div><h2 class="h-l" style="margin-top:10px">Let’s collaborate</h2>
      <form class="contact-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html">
        <input type="hidden" name="form-name" value="contact"><p hidden><label>Leave empty <input name="bot-field"></label></p>
        <label>Name<input name="name" required autocomplete="name"></label>
        <label>Company<input name="company" autocomplete="organization"></label>
        <label>Email<input type="email" name="email" required autocomplete="email"></label>
        <label>Interested in<select name="interest"><option>Brand partnership</option><option>Events & activations</option><option>Programs & content</option><option>The Mutual Card</option><option>Something else</option></select></label>
        <label class="full">Tell us about it<textarea name="message" required></textarea></label>
        <div class="full"><button class="btn" type="submit">Send</button></div>
      </form></div></section>`;

  R.aboutPage = (S) => {
    const A = S.about, cats = { media: "Media", prog: "Programmes & events", place: "Place-making", ip: "IP characters" };
    return pageHero("About", "The new <span class='serif'>culture of golf</span>", esc(S.brand.intro)) +
      `<section class="sec"><div class="wrap"><div class="eyebrow rv">Channel insights</div><div class="stats rv" style="margin:14px 0 40px">${stats(S.stats)}</div>
        <div class="facts rv">${A.audience.map((f) => `<div><small>${esc(f.k)}</small><b>${esc(f.v)}</b></div>`).join("")}</div></div></section>
      <section class="sec" style="background:var(--cream)"><div class="wrap"><div class="sec-head rv"><div><div class="eyebrow">What we do</div><h2 class="h-l">Three ways <span class="serif">into golf</span></h2></div></div>
        <div class="prog-list three">${[["Media & community", "YouTube, verticals and feed — 2.4M reached and a community of 10K+ around golf culture.", "pl-media.jpg"], ["Brand products", "Mutual Club × Club of Five merchandise, and the Mutual Card — powered by The Card, owned by APLGI.", "pl-brand.jpg"], ["Real-life experience", "Tournaments, a reality show, markets, clinics and community nights — golf off the screen.", "pl-irl.jpg"]].map(([t, x, i]) => `<div class="prog tall rv"><div class="pg-img"><img src="assets/img/${i}" alt="" loading="lazy"></div><div><h3>${t}</h3><p style="margin-top:6px">${x}</p></div></div>`).join("")}</div></div></section>
      <section class="sec eco"><div class="wrap"><div class="eyebrow rv">Our ecosystem</div><h2 class="h-l rv" style="margin-top:10px">${esc(A.group_title)}</h2><p class="lead rv">${esc(A.group_text)}</p>
        <div class="eco-stats rv">${stats(A.group_stats)}</div>
        ${Object.keys(cats).map((k) => `<div class="eco-cat rv"><h4>${cats[k]} · ${A.group.filter((g) => g.cat === k).length}</h4><div class="eco-logos">${A.group.filter((g) => g.cat === k).map((g) => `<img src="${esc(g.logo)}" alt="${esc(g.name)}" title="${esc(g.name)}" loading="lazy">`).join("")}</div></div>`).join("")}
      </div></section>` + R.work(S);
  };

  R.thanksPage = (S) => pageHero("Thank you", "We’ll be <span class='serif'>in touch</span>", "Thanks for reaching out — the Mutual team will reply by email soon.") + `<section class="sec"><div class="wrap"><a class="btn" href="index.html">Back to home</a></div></section>`;

  const PAGES = {
    index: ["hero", "intro", "make", "experience", "videos", "reels", "products", "collab", "work"],
    programs: ["programsPage"], thanks: ["thanksPage"], events: ["eventsPage"], products: ["productsPage"], collaborations: ["collabPage"], about: ["aboutPage"]
  };

  function reveal() {
    const els = document.querySelectorAll(".rv");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }

  function cycleCards() {
    const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-cycle]").forEach((card, ci) => {
      const slides = [...card.querySelectorAll(".mk-slide")], logos = [...card.querySelectorAll(".mk-lg")];
      if (slides.length < 2) return;
      let i = 0, timer = null, hover = false;
      const track = card.querySelector(".mk-track");
      const show = (n) => {
        i = (n + slides.length) % slides.length;
        slides.forEach((x, k) => x.classList.toggle("on", k === i)); logos.forEach((x, k) => x.classList.toggle("on", k === i));
        if (track) { const first = Math.max(0, Math.min(i - 1, slides.length - 3)); track.style.transform = `translateX(${-first * 100 / 3}%)`; }
      };
      const start = () => { if (still) return; clearInterval(timer); timer = setInterval(() => { if (!hover && !document.hidden) show(i + 1); }, 3200); };
      logos.forEach((b, k) => { b.addEventListener("mouseenter", () => show(k)); b.addEventListener("focus", () => show(k)); b.addEventListener("click", () => { show(k); start(); }); });
      card.addEventListener("mouseenter", () => { hover = true; }); card.addEventListener("mouseleave", () => { hover = false; });
      setTimeout(start, ci * 800);
    });
  }

  function menu() {
    const b = document.querySelector(".burger"), m = document.querySelector(".mobile-menu");
    if (!b) return;
    b.addEventListener("click", () => { const open = document.body.classList.toggle("menu-open"); b.setAttribute("aria-expanded", open); m.setAttribute("aria-hidden", !open); });
    m.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));
  }

  fetch("data/site.json", { cache: "no-cache" }).then((r) => r.json()).then((S) => {
    document.getElementById("header").outerHTML = header();
    const main = document.getElementById("main");
    main.innerHTML = (PAGES[here] || PAGES.index).map((k) => R[k](S)).join("");
    document.getElementById("footer").outerHTML = footer(S);
    menu(); reveal(); cycleCards();
    if (location.hash) { const t = document.querySelector(location.hash); if (t) setTimeout(() => t.scrollIntoView(), 50); }
  }).catch((e) => { console.error(e); document.getElementById("main").innerHTML = '<p style="padding:80px 24px">Could not load content.</p>'; });
})();
