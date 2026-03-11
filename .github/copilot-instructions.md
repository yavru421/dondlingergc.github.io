# Project Guidelines

## Owner / Context
- John Dondlinger — now employed full-time at **Ellis Construction, Stevens Point, WI**. No longer actively running his own GC business.
- This site (`dondlingergc.com`) is a **personal tools hub** for John, his friends, fans, and anyone who finds something useful here. There is no client or boss to answer to.
- The flagship tool is **ForgeTape** — a Blazor/WebAssembly construction calculator PWA at `/calc/wwwroot/`. Installable on iPhone via Safari "Add to Home Screen". Priority #1.
- Prior "Dondlinger General Contracting" business branding is **legacy** — do not emphasize it in new work. Retain existing UI elements unless explicitly replacing them.

## Code Style
- File naming: Kebab-case for files (e.g., mobile-optimization.ps1), camelCase for JS classes/variables (e.g., RabbitHole).
- Styling: Use CSS variables (--bg, --accent) in :root. Inter font from Google Fonts. Dark theme (#0b0d11 bg, #00d4ff accent). Media queries for responsiveness (@media(max-width:900px)).
- JS patterns: Class-based logic, event listeners for touch/swipe, debouncing. Reference script.js for UI behavior patterns.

## Architecture
- Personal site / tools playground. No monetization pressure. Build what's cool and useful.
- Desktop metaphor UI (index.html) with Windows-style taskbar, draggable windows, start menu, animated clock on background.
- Tools available as windows: Updates, Plans (blueprints), Contact, Calculator (ForgeTape PWA), Website Builder, Chat, Rabbit Hole, Taxidermy, 3D Tours, Cotton Thimble, Settings.
- Static site on GitHub Pages. Mobile users get the RabbitHole Wikipedia explorer (mobilestatic/mobile.html). Width ≤900px or mobile UA triggers redirect.
- **Calculator PWA (ForgeTape):** Blazor WebAssembly at `/calc/wwwroot/`. Has service worker for offline support. iOS install: Safari → Share → Add to Home Screen. Android/Chrome: `beforeinstallprompt` banner. Add `apple-mobile-web-app-capable` and related iOS meta tags when modifying `calc/wwwroot/index.html`.
- API bridge via Express server for WebRTC signaling (in-memory, `server.js`). Separate mobile variants in mobilestatic/ and public/.
- Blueprints system: Dynamic viewer loads from blueprints-manifest.json (regenerate with `python generate_blueprints.py`).
- Components: Modals in components/ for reusability. API client in js/bridge-client.js.

## Build and Test
- Local server: `npx serve mobilestatic --listen 8080` (task: "Start local static server").
- API server: `node server.js` for /api/bridge endpoints.
- Blueprints: `python generate_blueprints.py` to update manifest after asset changes.
- Mobile optimization: `.\mobile-optimization.ps1` applies patches with backups.
- Test: Manual testing; no automated tests. Prioritize iPhone Safari testing for PWA install and touch handling.

## Conventions
- Asset paths: Relative only (e.g., fetch('blueprints.json')). No absolutes.
- Build cool things fast. Rapid prototyping, iterate freely — this is a personal lab.
- Mobile-first: Test on actual devices (especially iPhone); dev tools miss timing bugs and iOS Safari quirks.
- Deployment: Static to GitHub Pages. Run Python script post-asset changes. Clear cache after deploy.
- Pitfalls: JS timing errors cause blank pages; performance issues with large assets; API data lost on server restart; iOS Safari does NOT fire `beforeinstallprompt` — use explicit "Share → Add to Home Screen" instructions instead.

See README.md for project overview.</content>
<parameter name="filePath">c:\Users\John\Desktop\dondlingergc.com\.github\copilot-instructions.md