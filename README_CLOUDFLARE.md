# Cloudflare Worker Chat API

This Worker proxies chat requests to the Llama API (or your own backend).

## Deploying to Cloudflare

1. Install Wrangler CLI:
   npm install -g wrangler

2. Fill in your `account_id` and `zone_id` in `wrangler.toml`.
   - Get these from your Cloudflare dashboard.

3. Set your API key as a secret:
   wrangler secret put LLAMA_API_KEY

4. Deploy:
   wrangler publish --env production

## Subdomain Setup

- In Cloudflare dashboard, add a DNS record for `chat.dondlingergc.com` (type: CNAME or A, as needed).
- Make sure your `wrangler.toml` route matches the subdomain.
- After deploying, your Worker will respond at `https://chat.dondlingergc.com`.

## Static Site (Optional)

- For static HTML/CSS/JS, use Cloudflare Pages or serve from a Worker Site.
- Point your subdomain (e.g., `builder.dondlingergc.com`) to the Pages project.

---

**Subdomain = a prefix to your main domain.**
- Example: `chat.dondlingergc.com` is a subdomain of `dondlingergc.com`.
- You can have many subdomains (e.g., `api.`, `blog.`, `builder.`).
