#!/usr/bin/env python3
"""Writes the page shells (head + meta + share tags + JSON-LD), sitemap.xml and robots.txt from scripts/pages.json.
Run from the repo root:  python3 scripts/seo.py   then   node scripts/prerender.js <server>  to fill <main> with content."""
import json, html, datetime, re, os
cfg = json.load(open('scripts/pages.json')); SITE = cfg['site']
data = json.load(open('data/site.json')); b = data['brand']
today = datetime.date.today().isoformat()
org = {"@context": "https://schema.org", "@type": "Organization", "name": "Mutual", "alternateName": "The Mutual Golf",
       "url": SITE + "/", "logo": SITE + "/assets/logos/apple-touch-icon.png", "description": b['intro'],
       "foundingDate": "2025", "areaServed": "ID",
       "parentOrganization": {"@type": "Organization", "name": "Redwoods Digital Growth Group"},
       "contactPoint": {"@type": "ContactPoint", "contactType": "partnerships", "telephone": "+" + b['whatsapp'], "availableLanguage": ["id", "en"]}}
website = {"@context": "https://schema.org", "@type": "WebSite", "name": "Mutual", "url": SITE + "/"}
SHELL = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base href="/">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="robots" content="{robots}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Mutual">
<meta property="og:locale" content="en_ID">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{img}">
<meta name="theme-color" content="#123a2a">
<script>try{{if(localStorage.getItem("theme")==="dark")document.documentElement.dataset.theme="dark"}}catch(e){{}}</script>
<link rel="icon" type="image/png" href="assets/logos/favicon.png">
<link rel="apple-touch-icon" href="assets/logos/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..900&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap">
<link rel="stylesheet" href="css/style.css">
<noscript><style>.rv{{opacity:1;transform:none}}</style></noscript>
{ld}
</head>
<body data-page="{page}">
<div id="header"></div>
<main id="main"><!-- PRERENDER:START --><!-- PRERENDER:END --></main>
<div id="footer"></div>
<script src="js/main.js"></script>
</body>
</html>
'''
def ld(*objs): return '\n'.join('<script type="application/ld+json">' + json.dumps(o, ensure_ascii=False) + '</script>' for o in objs)
e = lambda s: html.escape(s, quote=True)
for p in cfg['pages']:
    url = SITE + p['path']
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}] + ([] if p['path'] == '/' else [{"@type": "ListItem", "position": 2, "name": p['title'].split(' — ')[0].replace('About Mutual', 'About'), "item": url}])}
    objs = (org, website) if p['path'] == '/' else (crumbs,)
    open(p['file'] + '.html', 'w').write(SHELL.format(title=e(p['title']), desc=e(p['desc']), url=url, img=f"{SITE}/assets/share/{p['file']}.jpg", robots='index,follow,max-image-preview:large', ld=ld(*objs), page=p['file']))
open('404.html', 'w').write(SHELL.format(title='Page not found — Mutual', desc='This page could not be found.', url=SITE + '/', img=SITE + '/assets/share/index.jpg', robots='noindex', ld='', page='notfound'))
open('sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{SITE}{p["path"]}</loc><lastmod>{today}</lastmod></url>\n' for p in cfg['pages']) + '</urlset>\n')
open('robots.txt', 'w').write(f'User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: {SITE}/sitemap.xml\n')
print('wrote', len(cfg['pages']), 'pages + 404, sitemap.xml, robots.txt')
