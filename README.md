# Placed — AI Career Platform landing page

A responsive, animated landing page for **Placed**, built from the Figma file *Test-Design* (frame `115:40`, 1440px artboard).
It's plain HTML, CSS and JavaScript with no framework and no npm dependencies.

**Live:** https://placed-landing.vercel.app

## Features

- Pixel-matched to the 1440 Figma artboard; responsive at extra-large, large (≥1024), medium (768–1023) and small (<768) widths
- Scroll-reveal animations and a staggered hero entrance; parallax on the hero and CTA imagery
- **AI tools section:**
  - Sticky tab bar with scroll-spy and a sliding underline
  - Cards stack on top of each other with a fixed 40px gap below the bar
  - The four card illustrations are animated with HTML/CSS and loop continuously
- **Steps cards:** looping illustrations (resume autofill, orbiting icons, algorithm list)
- **How It Helps:** a timeline that draws progressively as you scroll
- Count-up stats, expandable testimonials, FAQ accordion
- **Blog:** an infinite auto-playing carousel with arrows, drag/swipe, and pause on hover or when off-screen
- Newsletter form validation and mobile menu; AI Tools dropdown
- Accessible: semantic markup, ARIA on tabs/accordion/menu, keyboard support, `prefers-reduced-motion` respected
- Looping animations pause when off-screen or when the browser tab is hidden

## Project structure

```
.
├── index.html          # built page (generated from src/index.src.html)
├── styles.css          # all styles + breakpoints
├── app.js              # all behaviour (no dependencies)
├── assets/             # images, icons and logos
├── src/
│   ├── index.src.html  # page source (edit this)
│   └── build.py        # inlines the tab icons → index.html
└── vercel.json
```

## Run locally

Any static server works:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Editing

Edit `src/index.src.html`, then regenerate `index.html`:

```bash
python3 src/build.py
```

The build step only inlines the four AI-tool tab icons (`assets/tab1–4.svg`) as `currentColor` SVGs so their colour can animate. `styles.css` and `app.js` are edited directly.

## Deploy

**Vercel**: import the repo with Framework preset **Other**, no build command, and output directory `.`. Or use the CLI:

```bash
npx vercel deploy --prod
```

It also works as-is on GitHub Pages, Netlify or any static host.

## Notes

- FAQ answers 02–05 are placeholders (`data-placeholder`), because the design only provides answer 01.
- Blog posts 3–6 use photos from [Unsplash](https://unsplash.com) (Unsplash License); their copy is sample content.
- Fonts are loaded from Google Fonts: Urbanist, IBM Plex Serif, Shrikhand, DM Mono.
