// What the dashboard can edit. ONE list drives both sides:
//  - cms/admin.js builds its forms from it
//  - netlify/functions/cms.mjs accepts ONLY these fields when saving (everything else in data/site.json is kept as it is)
// Field types: text, area, url, image, toggle, lines (one text per line), pairs ("number | label" per line),
//              images (a fixed row of pictures), list (repeating items with their own fields).
// k = path inside data/site.json (inside a list: path inside the item).

const stat = [{ k: "n", label: "Number", type: "text", max: 12 }, { k: "l", label: "Label", type: "text", max: 60 }];
const program = [
  { k: "short", label: "One-line tagline", type: "text", max: 80 },
  { k: "text", label: "Description", type: "area", max: 600 },
  { k: "img", label: "Cover picture", type: "image" }
];

export default [
  {
    id: "home", title: "Homepage", hint: "The first things visitors read.",
    groups: [
      { title: "Under the banner video", fields: [{ k: "hero.line", label: "Line next to the logo", type: "area", max: 200 }] },
      { title: "Introduction", fields: [
        { k: "brand.intro_title", label: "Headline", type: "text", max: 90 },
        { k: "brand.intro", label: "Paragraph (also used in the footer and on About)", type: "area", max: 500 }
      ] },
      { title: "The numbers", fields: [{ k: "stats", type: "list", label: "Numbers", itemLabel: "l", max: 4, fields: stat }] }
    ]
  },
  {
    id: "programs", title: "Programs", hint: "Each show’s tagline, description and cover. Latest episodes come from YouTube by themselves.",
    groups: [
      { title: "YouTube shows", fields: [{ k: "programs.youtube", type: "list", label: "Shows", itemLabel: "name", fields: program }] },
      { title: "Vertical series", fields: [{ k: "programs.vertical", type: "list", label: "Series", itemLabel: "name", fields: program }] },
      { title: "Feed & editorial", fields: [{ k: "programs.editorial", type: "list", label: "Series", itemLabel: "name", fields: program }] }
    ]
  },
  {
    id: "events", title: "Events", hint: "Add, edit, reorder or remove events. The order here is the order on the site.",
    groups: [
      { title: "Events", fields: [{ k: "events", type: "list", label: "Events", itemLabel: "name", add: "Add an event", remove: true, sort: true, max: 30, rename: true, fields: [
        { k: "name", label: "Event name", type: "text", max: 80, required: true },
        { k: "tag", label: "Kind (Tournament, Market, Clinic…)", type: "text", max: 30 },
        { k: "date", label: "Date", type: "text", max: 40 },
        { k: "place", label: "Place", type: "text", max: 120 },
        { k: "text", label: "Description", type: "area", max: 600 },
        { k: "img", label: "Picture", type: "image" },
        { k: "stats", label: "Figures — one per line, as: number | label", type: "pairs", max: 5 },
        { k: "home", label: "Show on the homepage", type: "toggle" }
      ] }] }
    ]
  },
  {
    id: "products", title: "Products", hint: "The featured product gets the big banner on the Products page.",
    groups: [
      { title: "Products", fields: [{ k: "products", type: "list", label: "Products", itemLabel: "name", add: "Add a product", remove: true, sort: true, max: 20, fields: [
        { k: "name", label: "Product name", type: "text", max: 80, required: true },
        { k: "text", label: "Description", type: "area", max: 600 },
        { k: "img", label: "Picture", type: "image" },
        { k: "hidden", label: "Hide from the site", type: "toggle" },
        { k: "featured", label: "Featured (big banner on the Products page — choose one)", type: "toggle" },
        { k: "kicker", label: "Featured · small label above the name", type: "text", max: 40 },
        { k: "sub", label: "Featured · line under the name", type: "text", max: 80 },
        { k: "banner", label: "Featured · banner picture", type: "image" },
        { k: "gallery", label: "Featured · three more pictures", type: "images", count: 3 }
      ] }] }
    ]
  },
  {
    id: "collab", title: "Collaborations", hint: "Numbers, case studies, partners and the two “Work with Mutual” cards.",
    groups: [
      { title: "Numbers on the green band", fields: [
        { k: "collab.brands_count", label: "Brands in our community", type: "text", max: 10 },
        { k: "collab.courses_count", label: "Partner courses", type: "text", max: 10 }
      ] },
      { title: "Case studies", fields: [{ k: "cases", type: "list", label: "Case studies", itemLabel: "name", add: "Add a case study", remove: true, sort: true, max: 9, fields: [
        { k: "name", label: "Title", type: "text", max: 80, required: true },
        { k: "sub", label: "Small line", type: "text", max: 80 },
        { k: "text", label: "Description", type: "area", max: 400 },
        { k: "img", label: "Picture", type: "image" }
      ] }] },
      { title: "Partners", fields: [{ k: "collab.partners", label: "Partner names — one per line", type: "lines", max: 20 }] },
      { title: "Work with Mutual", fields: [{ k: "work", type: "list", label: "Cards", itemLabel: "title", max: 2, fields: [
        { k: "title", label: "Title", type: "text", max: 50 }, { k: "text", label: "Text", type: "area", max: 300 }
      ] }] }
    ]
  },
  {
    id: "about", title: "About", hint: "The three pillars and what else shows on the About page.",
    groups: [
      { title: "Three pillars", fields: [{ k: "about.pillars", type: "list", label: "Pillars", itemLabel: "title", max: 3, fields: [
        { k: "title", label: "Title", type: "text", max: 50 },
        { k: "serif", label: "Italic words after the title", type: "text", max: 50 },
        { k: "text", label: "Paragraph", type: "area", max: 400 },
        { k: "points", label: "Points — one per line", type: "lines", max: 6 },
        { k: "images", label: "Four pictures (tall, wide, small, small)", type: "images", count: 4 }
      ] }] },
      { title: "Optional sections", fields: [
        { k: "about.show_audience", label: "Show audience facts (age, SES, regions, gender)", type: "toggle" },
        { k: "about.show_ecosystem", label: "Show “Our ecosystem” (Redwoods group and its logos)", type: "toggle" }
      ] }
    ]
  },
  {
    id: "contact", title: "Contact & socials", hint: "Where the buttons and footer links go.",
    groups: [
      { title: "WhatsApp", fields: [
        { k: "brand.whatsapp", label: "Number for the link — digits only, with country code (62…)", type: "text", max: 16, pattern: "^[0-9]{8,16}$" },
        { k: "brand.whatsapp_display", label: "Number as shown on the site", type: "text", max: 24 }
      ] },
      { title: "Footer", fields: [
        { k: "brand.address", label: "Location", type: "text", max: 80 },
        { k: "brand.socials", type: "list", label: "Social links", itemLabel: "k", max: 3, fields: [{ k: "url", label: "Link", type: "url" }] }
      ] }
    ]
  }
];
