# Dondlinger GC Website Setup

## Prerequisites
- Node.js and npm installed
- Cloudflare account with domain dondlingergc.com

## Install Wrangler
Since npm install failed due to build issues, download Wrangler manually:

1. Go to https://github.com/cloudflare/wrangler/releases/latest
2. Download `wrangler-v3.28.1-x86_64-pc-windows-msvc.zip` (or latest version)
3. Extract to a folder, e.g., `C:\wrangler`
4. Add `C:\wrangler` to your PATH environment variable

Alternatively, if npm works: `npm install -g wrangler`

## Setup
1. Authenticate: `wrangler auth login`
2. Create D1 database: `wrangler d1 create dondlingergc_db`
3. Copy the database_id from the output
4. Update `wrangler.toml` with the actual database_id
5. Create the table: `wrangler d1 execute dondlingergc_db --file=schema.sql`
6. Deploy: `wrangler pages deploy .`

## Features Added
- 3D Architectural Preview with Three.js
- Contact form with D1 storage
- Blueprints gallery with PDFs and images
- Glassmorphism UI
- View Transitions API

## Subdomains Setup
To create dedicated subdomains:

1. In Cloudflare Dashboard > Pages > Your Project > Custom Domains
2. Add `blueprints.dondlingergc.com` and `portal.dondlingergc.com`
3. Update `functions/index.js` to route based on hostname
4. For blueprints subdomain, serve the gallery
5. For portal, serve client portal with authentication

## Next Steps
- Seed blueprints data into D1
- Add authentication for portal
- Implement dynamic project gallery