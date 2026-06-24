# Cloudflare Setup For `/calc/`

This repo now assumes the calculator PWA lives at `/calc/`.

## Goal

Cloudflare must stop interfering with calculator assets and must stop turning asset requests into HTML.

## 1. Disable or bypass security features on `/calc/*`

If you use Bot/WAF features, create a rule that matches:

```txt
http.host eq "dondlingergc.com" and starts_with(http.request.uri.path, "/calc/")
```

Use `Skip` where available for:

- WAF managed rules
- Super Bot Fight Mode
- Browser Integrity Check
- Rate limiting rules that affect page/app loads

If plain `Bot Fight Mode` is enabled zone-wide, turn it off while stabilizing the PWA.

## 2. Disable Cloudflare HTML/script rewriting on `/calc/*`

For the same `/calc/*` path, disable:

- Rocket Loader
- Email Obfuscation
- Automatic HTTPS Rewrites
- Any HTML minification or script rewriting features

## 3. Make sure no Worker or rewrite touches `/calc/*`

Check for:

- Worker routes on `dondlingergc.com/*`
- URL rewrite rules
- redirect rules
- SPA fallbacks that send missing routes to `/index.html`

`/calc/*` must be served as static files, not rewritten.

## 4. Cache behavior

Bypass or aggressively revalidate cache for:

- `/calc/`
- `/calc/index.html`
- `/calc/service-worker.js`
- `/calc/service-worker-assets.js`
- `/calc/manifest.webmanifest`

Static assets may be cached long-term:

- `/calc/_framework/*`
- `/calc/css/*`
- `/calc/*.png`

## 5. After deploy

Purge cache for `/calc/*` or purge everything once.

Then test these exact URLs directly:

- `https://dondlingergc.com/calc/`
- `https://dondlingergc.com/calc/manifest.webmanifest`
- `https://dondlingergc.com/calc/service-worker.js`
- `https://dondlingergc.com/calc/css/bootstrap.min.css`
- `https://dondlingergc.com/calc/_framework/dotnet.t975l6eczi.js`

## Expected result

- HTML pages return `text/html`
- CSS returns `text/css`
- JS returns `application/javascript`
- manifest returns `application/manifest+json`
- no asset under `/calc/*` returns HTML unless it is actually an HTML page

If any calculator asset returns HTML, deployment or Cloudflare routing is still wrong.
