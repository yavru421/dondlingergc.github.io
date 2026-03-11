# dondlingergc.com

This repo is now centered on one thing: the **Jobsite Calculator** PWA.

## Product

- Primary app route: `/calc/`
- Goal: installable on **iPhone Safari** and usable offline
- Stack: static site + published Blazor WebAssembly assets

## Current structure

- [index.html](C:/Users/John/Desktop/dondlingergc.com/index.html): minimal landing page that points people to `/calc/`
- [calc/index.html](C:/Users/John/Desktop/dondlingergc.com/calc/index.html): real calculator entrypoint
- [calc/service-worker.js](C:/Users/John/Desktop/dondlingergc.com/calc/service-worker.js): PWA offline worker scoped to `/calc/`
- [calc/manifest.webmanifest](C:/Users/John/Desktop/dondlingergc.com/calc/manifest.webmanifest): install metadata for phone/home-screen install
- [calc/_framework](C:/Users/John/Desktop/dondlingergc.com/calc/_framework): Blazor WebAssembly runtime assets

## iPhone install flow

1. Open `https://dondlingergc.com/calc/` in Safari.
2. Tap `Share`.
3. Tap `Add to Home Screen`.
4. Launch the installed app from the home screen.

## Deployment notes

- Deploy the `calc/` directory exactly as published.
- Do not rewrite `/calc/*` requests to the main site.
- Keep `service-worker.js`, `service-worker-assets.js`, `manifest.webmanifest`, and `index.html` fresh after deploy.
- Purge Cloudflare cache after changing calculator assets.

## Cloudflare requirements

- Exclude `/calc/*` from challenge/bot features while stabilizing the PWA.
- Disable Rocket Loader and similar HTML/script rewriting on `/calc/*`.
- Ensure missing files under `/calc/*` do not fall back to HTML.
- If a static asset under `/calc/*` returns `text/html`, the deployment is still wrong.
