
# Dondlinger GC Website

## Cloudflare Pages Static Deployment

- All static assets (HTML, JS, JSON, favicon, etc.) are in the project root.
- All fetches use relative paths (e.g., `fetch('blueprints.json')`).
- All data files (like `blueprints.json`) are present in the deployed directory.
- Favicon is included as `favicon.ico` in the root and referenced in all HTML files.
- No file:// or absolute path references are used.
- No server-side code is required.
- For SPA routing, add a `_redirects` file if needed.

## Deployment
This site is deployed using **GitHub Pages** with a custom domain (dondlingergc.com).

### How to Deploy
1. Push changes to the `main` branch
2. GitHub Pages automatically deploys from the repository root
3. Changes are live within minutes

## Features
- Interactive 3D architectural previews with Three.js
- Dynamic blueprint viewer loading PNG/PDF entries from `blueprints.json`
- Contact form via Formspree
- Modern glassmorphism UI with View Transitions API

## Contact Form Setup
The contact form uses [Formspree](https://formspree.io) for handling submissions:

1. Sign up for a free Formspree account
2. Create a new form and get your form ID
3. Replace `YOUR_FORM_ID` in `index.html` with your actual form ID
4. Form submissions will be emailed to you

## File Structure
- `index.html` - Main website
- `blueprints/` - Architectural drawings and PDFs
- `blueprints.json` - Blueprint metadata manifest for the viewer
- `CNAME` - Custom domain configuration
- `.gitignore` - Git ignore rules

## Development
- Edit `index.html` for content changes
- Add or update blueprint metadata in `blueprints.json` (see example below)
- Commit and push to deploy

## Blueprint Catalog Manifest
Keep the viewer in sync by editing `blueprints.json`. Each entry should look like this:
```
{
	"filename": "fawley.png",
	"type": "png",
	"title": "Fawley Residence",
	"description": "Complete residential blueprint with floor plans and elevations"
}
```
Supported `type` values: `png`, `jpg`, `pdf`. The viewer automatically highlights the first entry and renders the correct preview.