# Project Guidelines

## Product focus

- This repo is no longer treated as a multi-tool desktop site.
- The only product that matters right now is the **Jobsite Calculator** PWA at `/calc/`.
- Priority order:
  1. `/calc/` loads reliably
  2. iPhone Safari install works
  3. offline behavior works
  4. branding and marketing copy are secondary

## Technical direction

- Static hosting only.
- Keep the calculator as published Blazor WebAssembly assets.
- Prefer simplifying around the calculator instead of preserving legacy pages.
- Avoid reintroducing heavy homepage logic, desktop-window UI, or unrelated features unless explicitly requested.

## PWA requirements

- Route must be `/calc/`, not `/calc/wwwroot/`.
- `manifest.webmanifest` must use `/calc/` for `id`, `start_url`, and `scope`.
- `service-worker.js` must stay scoped to `/calc/`.
- iPhone install guidance must assume Safari `Share -> Add to Home Screen`.
- Be careful with line endings on generated Blazor JS and HTML because SRI can break if deployed bytes change.

## Deployment assumptions

- Cloudflare may sit in front of the static host.
- `/calc/*` must not be rewritten, challenged, or transformed into HTML.
- If a CSS or JS asset returns `text/html`, treat that as a deployment or Cloudflare config failure first.
- Purge cache after shipping calculator changes.

## Editing guidance

- Keep changes pragmatic and small when possible.
- Favor direct asset-path correctness over abstract cleanup.
- When changing the calculator entrypoint, verify:
  - `calc/index.html`
  - `calc/manifest.webmanifest`
  - `calc/service-worker.js`
  - `calc/_framework/*`

## Testing guidance

- Manual testing is primary.
- Test on actual iPhone Safari whenever possible.
- Minimum smoke test:
  1. open `/calc/`
  2. confirm no console fetch/SRI/MIME failures
  3. confirm manifest loads
  4. confirm service worker registers
  5. confirm Add to Home Screen flow is visible/documented
