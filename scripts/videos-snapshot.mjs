// Writes data/videos.json — the fallback copy of the latest videos, used if /api/videos is unavailable and by prerender.
//   node scripts/videos-snapshot.mjs
import { build } from "../netlify/functions/videos.mjs";
import fs from "fs";
const v = await build();
fs.writeFileSync(new URL("../data/videos.json", import.meta.url), JSON.stringify(v, null, 1));
console.log("latest", v.latest.length, Object.entries(v.programs).map(([k, a]) => k + ":" + a.length).join("  "));
