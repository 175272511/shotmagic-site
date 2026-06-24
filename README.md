# shotmagic-site

Marketing site for **ShotMagic** — a free Chrome extension that beautifies screenshots
with device mockups, annotations, 3D tilt, and 100+ backgrounds.

→ Live: https://shotmagic.app

## Stack

- [Astro 5](https://astro.build/) — zero-runtime static output
- Vanilla CSS (CSS variables, no framework)
- Deployed on [Cloudflare Pages](https://pages.cloudflare.com/)

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output to ./dist
npm run preview  # serve ./dist
```

## Deploy

Pushes to `main` auto-deploy via Cloudflare Pages. Build command: `npm run build`. Output: `dist/`.
