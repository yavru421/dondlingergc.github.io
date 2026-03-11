# dondlingergc.com

Personal site for John Dondlinger — now at **Ellis Construction, Stevens Point, WI**.

This is my corner of the internet. It's for me, my friends, my fans, and anyone who wants to use the tools I build. No clients to impress, no boss to answer to. Just cool stuff that works.

---

## What's here

### 🧮 ForgeTape — Jobsite Construction Calculator (flagship)

A full offline-capable PWA built in Blazor/WebAssembly. Does the math that matters on a job site:

- Fraction tape arithmetic
- Spacing calculations
- Concrete volume
- Stair layout
- Board feet

**Install on iPhone:** Open `https://dondlingergc.com/calc/wwwroot/` in **Safari**, tap the **Share** button, then **Add to Home Screen**. Done — works offline.

**Install on Android/Chrome:** Visit the same URL, tap the install banner or the "Install" button that appears.

> Direct link: `/calc/wwwroot/`

---

### 🐇 Rabbit Hole

Swipe-based Wikipedia exploration. Swipe right → follow a related article. Swipe left → jump somewhere random. Mobile-first. Genuinely addictive.

### 🎨 Website Builder

Embedded web design wizard (HuggingFace space).

### 💬 Chat

Live chat tool (HuggingFace space).

### 📐 Blueprints / Plans

Construction blueprints viewer. Reads from `blueprints-manifest.json`. Regenerate after adding assets: `python generate_blueprints.py`

### 🧵 Cotton Thimble

Matterport 3D tour of grandma's fabric store in Wisconsin. It stays.

### 🗺️ 3D Tours, 🦌 Taxidermy, and more

Other tools and embedded experiences — added as I feel like it.

---

## Architecture

- **Desktop experience:** Windows-metaphor UI (index.html) — taskbar, draggable windows, start menu, clock
- **Mobile experience:** RabbitHole Wikipedia explorer (mobilestatic/mobile.html)
- **Calculator PWA:** Blazor WebAssembly at `/calc/wwwroot/` — fully offline, installable on iOS and Android
- **Static hosting:** GitHub Pages → dondlingergc.com
- **API bridge:** `server.js` (Express) for WebRTC signaling — `/api/bridge` endpoints, in-memory state
- **Blueprints:** `blueprints-manifest.json` driven, regenerate with `python generate_blueprints.py`
- **Components:** `components/` for reusable JS web components (user-profile, history-modal, auth-modal)

---

## Running locally

```bash
# Static site
npx serve mobilestatic --listen 8080

# API server
node server.js

# Regenerate blueprints manifest after adding files
python generate_blueprints.py
```

---

## Stack

- Vanilla JS + CSS (main site)
- Blazor WebAssembly / .NET (ForgeTape calculator)
- Inter font, CSS custom properties, dark theme
- GitHub Pages (static), Cloudflare (DNS)
- HuggingFace Spaces (embedded tools)
