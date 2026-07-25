# Workspace Rules & Context

- **Project:** dondlingergc.com (The "Dondlinger Digital Database")
- **Design Philosophy:** Radically transparent, anti-establishment, strictly anti-Silicon-Valley-tech-bro. Pure utility, speed, and dark-mode aesthetics for guys in the field (construction workers, audio engineers, outdoorsmen). Everything is free, open-source, and utilitarian.
- **Aesthetic Constraints:** Do not use corporate pop-ups or generic marketing fluff. Ensure dark-mode contrast ratios are highly readable outdoors (use lighter `#9ca3af` text against dark backgrounds instead of low-contrast grays). Avoid standard Bootstrap/Tailwind looks unless strictly needed.
- **Navigation:** The site utilizes a horizontal glassmorphic "Tactical Bottom Bar" with large hit targets (icons) instead of standard hamburger menus or vertical dots. 
- **WaZWeather HUD:** Telemetry cards are swipeable (`scroll-snap-type`) and mapped to specific IDs (e.g. `card-now`, `card-forecast`). Auto-jumping from Persona mode selection directs to the `card-now` section. 
- **Data specifics:** Hydrology metrics strictly refer to the "Wisconsin River", not Lake Wazeecha.
- **Live State Audit Invariant:** Before proposing or executing ANY layout changes, redesigns, or file overwrites on `dondlingergc.com`, the agent MUST run a live browser DOM sweep (`evaluate_script` / `take_snapshot`) to verify the exact active layout state.
- **Wrangler & Cloudflare First:** Always query Cloudflare state directly via `wrangler` CLI or Cloudflare MCP tools (D1 tables, Pages, KV) before forming hypotheses about database or deployment status.
- **Root Layout Invariant:** `dondlingergc.com` root (`/`) MUST ALWAYS render the **3-Way Tectonic Split Gateway** (`www_index.html` structure: Plate 1 = Dondlinger Digital Database PWA Catalog, Plate 2 = Touchscreen Diagnostic PWA, Plate 3 = WaZWeather Live Telemetry).
- **Epoch 0 Historical Isolation Invariant:** ALL files, drone logs (e.g. broken CASPr thermal drone), and historical bids from Google Drive represent Epoch 0 historical backstory ONLY. NEVER propose or reference broken hardware or dead Epoch 0 projects as active features for `dondlingergc.com`.
- **No AI Tech-Bro Fluff:** Never propose theoretical WASM/WebGL/Passkey fluff. All personalization work must stay anchored to bare-metal HTML/CSS/JS: top-corner identity badge (`[ 👤 Login / Username ]`), in-page auth drawer for Cloudflare D1 users (`personalization.dondlingergc.com`), and persisted user state (quotes, weather alerts, job status).
- **Execution Over Talk:** Do NOT output verbose self-audits or apologies when corrected. Write code, record system rules, and present direct results immediately.



