# Project Guidelines

## Code Style
- File naming: Kebab-case for files (e.g., mobile-optimization.ps1), camelCase for JS classes/variables (e.g., RabbitHole).
- Styling: Use CSS variables (--bg, --accent) in :root. Inter font from Google Fonts. Dark theme (#0b0d11 bg, #00d4ff accent). Media queries for responsiveness (@media(max-width:900px)).
- JS patterns: Class-based logic, event listeners for touch/swipe, debouncing. Reference script.js for UI behavior patterns.

## Architecture
- Experimental bleeding-edge lab for web technologies and tools, aiming for monetization opportunities. Formerly branded as Don Dlinger General Contracting (Design • Build • Digital).
- Desktop metaphor UI with taskbar icons for tools: Updates, Plans (blueprints), Contact, Website Builder, Chat, Rabbit Hole, Taxidermy, 3D Tours, Cotton Thimble, Settings.
- Static site with Windows-like interface for unique branding. Mobile users redirected to mobile.html (width ≤900px or mobile UA).
- API bridge via Express server for WebRTC signaling (in-memory). Separate mobile variants in mobilestatic/ and public/.
- Blueprints system: Dynamic viewer loads from blueprints-manifest.json (regenerate with python generate_blueprints.py).
- Components: Modals in components/ for reusability. API client in js/bridge-client.js.
- Includes Google AdSense ads for monetization.

## Build and Test
- Local server: `npx serve mobilestatic --listen 8080` (task: "Start local static server").
- API server: `node server.js` for /api/bridge endpoints.
- Blueprints: `python generate_blueprints.py` to update manifest after asset changes.
- Mobile optimization: `.\mobile-optimization.ps1` applies patches with backups.
- Test: Manual testing; no automated tests. Prioritize mobile device testing for redirects and touch handling.

## Conventions
- Asset paths: Relative only (e.g., fetch('blueprints.json')). No absolutes.
- Experimental focus: Rapid prototyping, testing bleeding-edge ideas, iterating quickly for potential monetization.
- Mobile-first: Test on actual devices; dev tools miss timing bugs. Redirect script in <head> must run after DOM.
- Deployment: Static to GitHub Pages. Run Python script post-asset changes. Clear cache for updates.
- Pitfalls: JS timing errors cause blank pages; performance issues with large assets; API data lost on restart.

See README.md for project overview, MOBILE_OPTIMIZATION_README.md for mobile patches.</content>
<parameter name="filePath">c:\Users\John\Desktop\dondlingergc.com\.github\copilot-instructions.md