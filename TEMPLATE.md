Template usage — Convert this repo into a new site

This repository contains a static website scaffold intended to be reused as a lightweight site template for other projects. Follow these steps to create a new site from this template.

1) Create a new repo from this repository
   - Option A (recommended): On GitHub, click "Use this template" (or fork) and create a new repository.
   - Option B (local): Clone this repo and delete the `CNAME` file and other site-specific files.

2) Replace the example config
   - Copy `_site-config.example.js` to `_site-config.js` and update the values for `businessName`, `phone`, `email`, etc.
   - If you prefer JSON, you can create a `site.config.json` and adapt the small loader in `index.html`.

3) Replace content and assets
   - Replace files in `blueprints/` and update `blueprints.json` (or use `blueprints.example.json` as your starting manifest).
   - Replace `favicon.ico` and any images inside `public/` as needed.
   - Remove or update `CNAME` if you are not using the same custom domain.

4) Test locally
   - Start a simple static server from the project root (Python recommended):

```powershell
python -m http.server 8000
```

   - Open `http://localhost:8000` and verify the site loads and configuration is applied.

5) Deploy
   - Push to `main` (or the branch your CI/CD uses) and configure GitHub Pages or Cloudflare Pages to deploy the repository root.
   - If using GitHub Pages with a custom domain, add a `CNAME` file containing the domain.

6) Optional customizations
   - Replace `blueprints.json` with your own dataset (keep the same structure).
   - Add CI (GitHub Actions) or a Cloudflare Pages configuration if you need build steps.

Notes
   - Keep `_site-config.example.js` in the repo as a safe starting point for new sites.
   - Avoid committing production secrets; this template is intended for public, static sites.

