// GET /api/videos — the channel's latest videos, read from YouTube's public feeds (no API key).
// Returns { updated, latest: [...], programs: { "<program name>": [...] } }; each video = { id, title, date, views }.
// Cached at Netlify's edge for 30 min (and served stale while refreshing), so YouTube is asked rarely.
// scripts/videos-snapshot.mjs imports build() to write data/videos.json, the fallback the site uses if this fails.
const CHANNEL = "I6C1BqCtVmBl2a0zQ8zjkg"; // UC… id of @TheMutualGolf without the "UC"
const FEED = "https://www.youtube.com/feeds/videos.xml?playlist_id=";
// program name (as in data/site.json) -> playlist + how its full episodes are titled
const PROGRAMS = {
  "ASMR": { pl: "PLFgDaikm8FcnhX5RoerfcB8tUZLyPx0VP", re: /asmr/i },
  "Fairway Talk": { pl: "PLFgDaikm8Fcmy0G4kIM6dhErPROCbhpPZ", re: /fairway talk/i },
  "State of Par": { pl: "PLFgDaikm8FcmWGoE4I_HsByz4VYuwkVgr", re: /state of par/i },
  "Can We Even Swing?": { pl: "PLFgDaikm8FcmzlDskGRG2p1TDjW04Ev8q", re: /convert|can we even swing/i },
  "Play Off": { pl: "PLFgDaikm8FclSGB3XWx2fF9jpkAi_zze8", re: /play ?off/i },
  "Coach Says": { pl: null, re: /coach says/i },
  "Golf Tour": { pl: "PLFgDaikm8Fcn6BRiymKVyn_4Nhr6M2EWP", re: /golf ?tour/i },
  "Off Course": { pl: null, re: /off ?course/i }
};
const un = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const pick = (x, re) => (x.match(re) || [])[1] || "";

async function feed(id) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 6000);
  try {
    const r = await fetch(FEED + id, { signal: c.signal, headers: { "user-agent": "Mozilla/5.0 (compatible; site-feed-reader)" } });
    if (!r.ok) return [];
    const xml = await r.text();
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => ({
      id: pick(m[1], /<yt:videoId>([^<]+)</), title: un(pick(m[1], /<title>([^<]*)</)),
      date: pick(m[1], /<published>([^<]+)</).slice(0, 10), views: +pick(m[1], /views="(\d+)"/) || 0
    })).filter((v) => v.id);
  } catch (e) { return []; } finally { clearTimeout(t); }
}

export async function build() {
  const names = Object.keys(PROGRAMS);
  const [long, shorts, ...lists] = await Promise.all([feed("UULF" + CHANNEL), feed("UUSH" + CHANNEL), ...names.map((n) => PROGRAMS[n].pl ? feed(PROGRAMS[n].pl) : Promise.resolve([]))]);
  if (!long.length) throw new Error("YouTube feed returned no videos");
  const shortIds = new Set(shorts.map((v) => v.id));
  const programs = {};
  names.forEach((n, i) => {
    const seen = new Set(); const all = [...lists[i], ...long].filter((v) => !shortIds.has(v.id) && PROGRAMS[n].re.test(v.title) && !/\bout now\b|\bis out\b|have you watched/i.test(v.title) && !seen.has(v.id) && seen.add(v.id));
    programs[n] = all.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  });
  return { updated: new Date().toISOString(), latest: long.slice(0, 12), programs };
}

export default async () => {
  try {
    return new Response(JSON.stringify(await build()), { headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "netlify-cdn-cache-control": "public, durable, s-maxage=1800, stale-while-revalidate=86400"
    } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 502, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
};
export const config = { path: "/api/videos" };
