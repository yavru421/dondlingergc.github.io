# Security Hardening Notes

This repo now ships stronger browser hardening headers in [_headers](C:/Users/John/Desktop/dondlingergc.com/_headers) for the main landing page, the calculator, and a few static pages.

Important deployment note:

- `_headers` only works if your static host honors that file.
- If the site is ultimately served by GitHub Pages or another origin that ignores `_headers`, mirror the same headers in Cloudflare using `Rules -> Transform Rules -> Modify Response Header` or a Worker.

Cloudflare settings that still need to be applied outside the repo:

- Set SSL/TLS mode to `Full (strict)`.
- Enable `Always Use HTTPS`.
- Enable WAF managed rules.
- Enable `Bot Fight Mode` or `Super Bot Fight Mode`.
- Keep public `A` and `AAAA` records proxied through Cloudflare.
- Restrict the origin firewall to Cloudflare IP ranges and close unused ports.

After deployment, re-run SecurityHeaders and Mozilla Observatory against:

- `https://dondlingergc.com/`
- `https://dondlingergc.com/calc/`
