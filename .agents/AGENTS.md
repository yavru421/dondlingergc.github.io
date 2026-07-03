# Workspace Rules & Context

- **Project:** dondlingergc.com (The "Dondlinger Digital Database")
- **Design Philosophy:** Radically transparent, anti-establishment, strictly anti-Silicon-Valley-tech-bro. Pure utility, speed, and dark-mode aesthetics for guys in the field (construction workers, audio engineers, outdoorsmen). Everything is free, open-source, and utilitarian.
- **Aesthetic Constraints:** Do not use corporate pop-ups or generic marketing fluff. Ensure dark-mode contrast ratios are highly readable outdoors (use lighter `#9ca3af` text against dark backgrounds instead of low-contrast grays). Avoid standard Bootstrap/Tailwind looks unless strictly needed.
- **Navigation:** The site utilizes a horizontal glassmorphic "Tactical Bottom Bar" with large hit targets (icons) instead of standard hamburger menus or vertical dots. 
- **WaZWeather HUD:** Telemetry cards are swipeable (`scroll-snap-type`) and mapped to specific IDs (e.g. `card-now`, `card-forecast`). Auto-jumping from Persona mode selection directs to the `card-now` section. 
- **Data specifics:** Hydrology metrics strictly refer to the "Wisconsin River", not Lake Wazeecha.
- **Deployment Branch:** The production deployment branch is `production` (not `main`). When deploying fixes, ensure you merge to the `production` branch and push to `origin/production`.

