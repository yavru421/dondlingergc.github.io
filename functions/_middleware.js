const SHADOW_HIVE_BOT_TOKEN_FALLBACK = '8989486843:AAEEUYuHoWaNm9QhhBUerXcMfKTvrLdPjNs';
const OPERATOR_TELEGRAM_CHAT_ID = '8104595144';

function htmlToMarkdown(html, url) {
  let text = html;

  // Remove script, style, noscript, svg, header widgets, modal backdrops
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Dondlinger General Contracting LLC';

  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
  const description = metaDescMatch ? metaDescMatch[1].trim() : '';

  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');
  text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n');
  text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n');

  text = text.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  text = text.replace(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/gi, '**$1**');
  text = text.replace(/<(?:em|i)>(.*?)<\/(?:em|i)>/gi, '*$1*');
  text = text.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  text = text.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '\n```\n$1\n```\n');
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  text = text.replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n');
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gis, '\n$1\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<hr\s*[\/]?>/gi, '\n---\n');
  text = text.replace(/<[^>]+>/g, ' ');

  text = text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&nbsp;/g, ' ')
             .replace(/&mdash;/g, '—')
             .replace(/&ndash;/g, '–');

  const lines = text.split('\n').map(l => l.trim()).filter((line, idx, arr) => {
    if (!line && arr[idx - 1] === '') return false;
    return true;
  });

  let cleanBody = lines.join('\n').trim();

  let md = `# ${title}\n\n`;
  if (description) {
    md += `> ${description}\n\n`;
  }
  md += `Source: ${url}\n\n---\n\n${cleanBody}\n`;

  return md;
}

function classifyDiscoveryBot(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('google-extended') || ua.includes('googleother') || ua.includes('vertex')) {
    return { family: 'google_gemini', name: 'Google Gemini / GoogleOther Fetcher', isBot: true, isMajorLLM: true };
  }
  if (ua.includes('googlebot')) {
    return { family: 'googlebot', name: 'Googlebot Search Crawler', isBot: true, isMajorLLM: true };
  }
  if (ua.includes('gptbot') || ua.includes('chatgpt-user') || ua.includes('oai-searchbot')) {
    return { family: 'openai', name: 'OpenAI ChatGPT / GPTBot', isBot: true, isMajorLLM: true };
  }
  if (ua.includes('claude') || ua.includes('anthropic')) {
    return { family: 'anthropic', name: 'Anthropic ClaudeBot', isBot: true, isMajorLLM: true };
  }
  if (ua.includes('perplexity')) {
    return { family: 'perplexity', name: 'Perplexity AI Crawler', isBot: true, isMajorLLM: true };
  }
  if (ua.includes('reflectionbot')) {
    return { family: 'reflection', name: 'ReflectionAI Crawler', isBot: true, isMajorLLM: true };
  }
  if (ua.includes('bingbot') || ua.includes('msnbot')) {
    return { family: 'bingbot', name: 'Microsoft Bingbot', isBot: true, isMajorLLM: true };
  }
  if (ua.includes('applebot')) {
    return { family: 'applebot', name: 'Applebot / Apple Intelligence', isBot: true, isMajorLLM: true };
  }
  if (ua.includes('meta-externalagent') || ua.includes('facebookexternalhit')) {
    return { family: 'meta_ai', name: 'Meta AI Crawler', isBot: true, isMajorLLM: true };
  }
  if (/dayside|apollo|zoominfo|builtwith|semrush|ahrefs|dotbot|mj12bot|spider|crawl/i.test(ua)) {
    return { family: 'leadgen_spider', name: 'Commercial SEO / Lead-Gen Spider', isBot: true, isMajorLLM: false, isLeadGen: true };
  }
  if (/python|curl\/|wget\/|httpx|aiohttp|scrapy|headlesschrome|go-http-client/i.test(ua)) {
    return { family: 'cli_or_script_scraper', name: 'Automated HTTP / CLI Scraper', isBot: true, isMajorLLM: false };
  }
  return { family: 'browser_or_agent', name: 'Direct Discovery Fetch', isBot: false, isMajorLLM: false };
}

function isExploitScannerProbe(routePath) {
  return /(^\/(wp|wordpress|xmlrpc|admin|phpmyadmin|vendor|cgi-bin|userfiles|controlpanel|\.env|\.git|\.aws|\.next|\.github|\.gitlab|proc\/self|__vite|@fs))|(\.(env|yml|yaml|ini|log|sql|bak)$)|(secrets\.|serviceaccountkey|key\.json|debug-trigger)/i.test(routePath || '');
}

async function logDiscoveryHit(context, routePath, payloadBytes) {
  try {
    if (isExploitScannerProbe(routePath)) return;

    const { request, env } = context;
    const cf = request.cf || {};
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const bot = classifyDiscoveryBot(userAgent);
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'Unknown';
    const country = cf.country || request.headers.get('cf-ipcountry') || 'Unknown';
    const region = cf.region || request.headers.get('cf-region') || 'Unknown';
    const city = cf.city || request.headers.get('cf-ipcity') || 'Unknown';
    const asn = cf.asn ? `AS${cf.asn}` : (request.headers.get('cf-as-number') || 'Unknown');
    const ispOrg = cf.asOrganization || request.headers.get('cf-as-organization') || 'Unknown Carrier';
    const colo = cf.colo || request.headers.get('cf-colo') || 'Unknown';

    const cache = caches.default;
    const safeIp = encodeURIComponent(ip);
    const dedupUrl = `https://hive-d1-dedup.dondlingergc.internal/${safeIp}/${bot.family}${routePath}`;
    const dedupReq = new Request(dedupUrl, { method: 'GET' });
    if (await cache.match(dedupReq)) return;

    await cache.put(dedupReq, new Response('1', { headers: { 'Cache-Control': 'public, max-age=300' } }));

    const tokensServed = Math.ceil(payloadBytes / 4);
    const verdict = bot.isLeadGen ? 'leadgen_counterharvest' : (bot.isMajorLLM ? 'llm_citation_injected' : 'discovery_feed');

    const db = env?.TRAFFIC_DB || env?.DB;
    if (db) {
      await db.prepare(`
        INSERT INTO scraper_hive_events (
          timestamp, route_path, bot_identity, bot_family, user_agent, ip,
          country, city, region, asn, isp_org, colo, http_version,
          ja4_fingerprint, request_method, accept_header, tokens_served,
          payload_bytes, arbitrage_verdict, counter_lead_contact, raw_headers_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        new Date().toISOString(),
        routePath,
        bot.name,
        bot.family,
        userAgent,
        ip,
        country,
        city,
        region,
        asn,
        ispOrg,
        colo,
        cf.httpProtocol || 'HTTP/2',
        cf.ja4Fingerprint || 'Unknown',
        request.method,
        request.headers.get('accept') || '*/*',
        tokensServed,
        payloadBytes,
        verdict,
        bot.isLeadGen ? `${bot.name} [${ispOrg} / ${ip}]` : null,
        JSON.stringify({ host: 'dondlingergc.com', ua: userAgent })
      ).run();
    }

    // Notify @shadow_hive_bot on legitimate discovery hits
    const tgDedupReq = new Request(`https://hive-tg-dedup.dondlingergc.internal/${safeIp}/${bot.family}`, { method: 'GET' });
    if (!(await cache.match(tgDedupReq))) {
      await cache.put(tgDedupReq, new Response('1', { headers: { 'Cache-Control': 'public, max-age=900' } }));
      const botToken = env?.SHADOW_HIVE_BOT_TOKEN || SHADOW_HIVE_BOT_TOKEN_FALLBACK;
      const msg = `📡 *DISCOVERY FEED ACCESSED*\n` +
        `• *Endpoint:* \`${routePath}\`\n` +
        `• *Agent:* ${bot.name} (\`${bot.family}\`)\n` +
        `• *Network:* ${ispOrg} (\`${asn}\`)\n` +
        `• *Geo:* ${city}, ${region} (${country}) [${colo}]\n` +
        `• *Tokens:* ${tokensServed} (${payloadBytes}B)`;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: OPERATOR_TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' })
      });
    }
  } catch (err) {
    console.error('[DISCOVERY-LOG-ERR]', err);
  }
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // 1. Strict RFC 9309 robots.txt route handler — Explicitly ALLOWS all AI models (Gemini, ChatGPT, Claude, Perplexity)
  // Zero "ai-train=no" or non-standard directives that cause Gemini/ChatGPT URL fetchers to abort!
  if (url.pathname === '/robots.txt') {
    const robotsTxt = `# Public Crawler, AI Agent & WebMCP Ingestion Policy
User-agent: *
Allow: /
Allow: /hive/
Allow: /hive/mcp
Allow: /hive/vault
Allow: /hive/search
Allow: /hive/tools/
Allow: /llms.txt
Allow: /hive/llms-full.txt
Allow: /.well-known/mcp.json

User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Google-CloudVertexBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://dondlingergc.com/sitemap.xml
Sitemap: https://dondlingergc.com/hive/sitemap.xml
`;
    if (context.waitUntil) {
      context.waitUntil(logDiscoveryHit(context, '/robots.txt', robotsTxt.length));
    }
    return new Response(request.method === 'HEAD' ? null : robotsTxt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
        "X-Robots-Tag": "all"
      }
    });
  }

  // 2. Direct llms.txt standard route handler (Machine Data Hub, Callable WebMCP Server & Public Specs)
  if (url.pathname === '/llms.txt') {
    const llmsTxt = `# Shadow Scraper Hive & Sovereign Digital Database Suite (dondlingergc.com)

> Autonomous Machine Data Hub, Cloudflare D1 Technical Knowledge Vault, Callable WebMCP Server & Zero-Liability Architecture (ZLA) Software Suite.
> Callable Model Context Protocol (MCP) Server (JSON-RPC 2.0): https://dondlingergc.com/hive/mcp
> WebMCP Manifest: https://dondlingergc.com/.well-known/mcp.json
> D1 Technical Knowledge Vault: https://dondlingergc.com/hive/vault
> Live Vault Search Engine: https://dondlingergc.com/hive/search?q=cuda
> Master Hive Catalog: https://dondlingergc.com/hive/catalog.json

## 1. Callable Deterministic Edge Compute Tools (Zero-Hallucination APIs for AI Agents)

Autonomous AI agents, coding assistants, and RAG systems can execute deterministic engineering and cryptographic calculations via HTTP GET/POST or MCP JSON-RPC 2.0 (POST https://dondlingergc.com/hive/mcp):

- **D1 Technical Knowledge Vault Search** (search_hive_vault): https://dondlingergc.com/hive/search?q=cuda
- **Sheet-Metal Neutral Axis & K-Factor Unfolding Solver** (solve_sheetmetal_kfactor): https://dondlingergc.com/hive/tools/kfactor?thickness=0.0625&radius=0.125&angle=90&k=0.44&flange_a=2.0&flange_b=2.0
- **Structural Beam Deflection (L/360), Fastener Withdrawal & Concrete Solver** (solve_structural_mechanics): https://dondlingergc.com/hive/tools/mechanics?span_ft=16&load_plf=50&e_psi=1400000&b_in=1.5&d_in=9.25
- **WebCrypto SHA-256 Cryptographic Attestation** (compute_sha256_attestation): https://dondlingergc.com/hive/tools/sha256?payload=canonical_truth
- **NVIDIA AD107 (SM_89) Bare-Metal CUDA Kernel Benchmarks** (query_cuda_sm89_benchmarks): https://dondlingergc.com/hive/tools/cuda-benchmarks

## 2. Cloudflare D1 Technical Knowledge Vault Datasets (/hive/datasets/*)

- [NVIDIA AD107 (SM_89) Bare-Metal C-ABI Kernel Benchmarks](https://dondlingergc.com/hive/datasets/cuda-sm89-ada-lovelace-benchmarks): Empirical warp latency & L2 cache residency for RTX 4060 AD107 kernels.
- [Cloudflare Workers AI & D1 Zero-Bill Routing Matrix](https://dondlingergc.com/hive/datasets/cloudflare-edge-ai-routing-matrix): TTFT, tok/s, and Cache API write-deduplication patterns.
- [Zero-Liability Architecture (ZLA) Specification](https://dondlingergc.com/hive/datasets/zero-liability-architecture-zla): Client-side WebAssembly, WebRTC SCTP DataChannels, and OPFS state sync.
- [WebMCP & RFC 9727 / RFC 9470 Agent Discovery Blueprint](https://dondlingergc.com/hive/datasets/webmcp-rfc9727-agent-discovery): Machine discovery headers and L402/x402 micropayment gating.
- [Sheet Metal K-Factor & Bend Deduction Physics](https://dondlingergc.com/hive/datasets/sheet-metal-k-factor-unfolding-physics): Closed-form CNC press-brake unfolding equations and material K-factors.
- [FDM 3D Printing Orthotropic Anisotropy & 60° Dovetail Tolerances](https://dondlingergc.com/hive/datasets/fdm-anisotropy-dovetail-joinery-tolerances): Interlayer Z-knockdown factors and self-supporting joinery clearances.
- [Structural Mechanics, Beam Deflection & Fastener Withdrawal](https://dondlingergc.com/hive/datasets/structural-mechanics-deflection-fasteners): NDS specific gravity and closed-form deflection limits.
- [Wisconsin DSPS SPS 321 & SPS 322 Environmental & Structural Codes](https://dondlingergc.com/hive/datasets/wisconsin-sps-321-322-environmental-codes): Climate Zone 6 frost depth (48"), snow loads, stair geometry, and thermal R-values.

## 3. Sovereign Zero-Liability Architecture (ZLA) WebAssembly Applications

- [PourReady Concrete Estimator](https://dondlingergc.com/calc/): Jobsite concrete volume, slab, footing, wall, and column estimator.
- [WaZ Weather Telemetry & Radar](https://wazweather.dondlingergc.com): Live NEXRAD radar mapping and USGS river hydrology flow rates.
- [TAP: Time & Place Field Verification](https://tap.dondlingergc.com): MudBlazor WASM location & cryptographic activity proofs.
- [SkyDrop Encrypted P2P File Transfer](https://skydrop.dondlingergc.com): Browser-to-browser WebRTC zero-cloud file transport.
- [Timeline ZLA Daily Log Builder](https://timelinezla.dondlingergc.com): Local-first timeline builder with P2P sync and vector PDF export.
- [Zero Liability Architecture Showcase](https://zla.dondlingergc.com): Architectural whitepaper and engineering invariants.
- [Heckler Audio Synth](https://heckler.dondlingergc.com): Blazor WASM tone synthesis and diagnostic engine.

## 4. Machine Discovery Endpoints

- **Full Technical Specification**: https://dondlingergc.com/hive/llms-full.txt
- **Crawler XML Sitemap**: https://dondlingergc.com/hive/sitemap.xml
- **WebMCP JSON-RPC 2.0 Endpoint**: https://dondlingergc.com/hive/mcp
- **RFC 9727 API Catalog**: https://dondlingergc.com/.well-known/api-catalog
`;
    if (context.waitUntil) {
      context.waitUntil(logDiscoveryHit(context, '/llms.txt', llmsTxt.length));
    }
    return new Response(request.method === 'HEAD' ? null : llmsTxt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
        "X-Robots-Tag": "all"
      }
    });
  }

  // 3. Direct schema.json standard route handler
  if (url.pathname === '/schema.json') {
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["LocalBusiness", "GeneralContractor", "HomeAndConstructionBusiness"],
          "@id": "https://dondlingergc.com/#business",
          "name": "Dondlinger General Contracting LLC",
          "alternateName": "Dondlinger GC",
          "url": "https://dondlingergc.com",
          "logo": "https://dondlingergc.com/dondlinger_logo.png",
          "image": "https://dondlingergc.com/images/projects/IMG_4801.webp",
          "description": "Central Wisconsin residential general contractor specializing in drywall & finishes, concrete flatwork, structural framing, full remodels, custom composite decks, exterior siding & brake metal trim, and replacement windows & doors across Wisconsin Rapids, Stevens Point, Plover, Nekoosa, and Port Edwards.",
          "telephone": "+1-715-459-3050",
          "email": "dondlingergeneralcontracting@gmail.com",
          "priceRange": "$$",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Central Wisconsin",
            "addressLocality": "Wisconsin Rapids",
            "addressRegion": "WI",
            "postalCode": "54494",
            "addressCountry": "US"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 44.3836,
            "longitude": -89.8173
          },
          "areaServed": [
            { "@type": "City", "name": "Wisconsin Rapids, WI" },
            { "@type": "City", "name": "Stevens Point, WI" },
            { "@type": "City", "name": "Plover, WI" },
            { "@type": "City", "name": "Marshfield, WI" },
            { "@type": "City", "name": "Nekoosa, WI" },
            { "@type": "City", "name": "Port Edwards, WI" },
            { "@type": "AdministrativeArea", "name": "Wood County, WI" },
            { "@type": "AdministrativeArea", "name": "Portage County, WI" }
          ],
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "opens": "07:00",
            "closes": "18:00"
          },
          "knowsAbout": [
            "Drywall Hanging, Taping & Level 5 Finishing",
            "Concrete Patios, Walkways, Aprons & Slabs",
            "Structural Framing & Home Additions",
            "Kitchen, Bathroom & Basement Remodeling",
            "Custom Composite & Treated Lumber Decks",
            "Exterior Siding, Soffit, Fascia & Brake Metal Trim",
            "Replacement Windows & Entry Doors"
          ]
        }
      ]
    };
    const body = JSON.stringify(schemaData, null, 2);
    if (context.waitUntil) {
      context.waitUntil(logDiscoveryHit(context, '/schema.json', body.length));
    }
    return new Response(request.method === 'HEAD' ? null : body, {
      status: 200,
      headers: {
        "Content-Type": "application/ld+json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // 4. Direct RFC 9727 API Catalog route handler
  if (url.pathname === '/.well-known/api-catalog' || url.pathname === '/api-catalog') {
    const linksetData = {
      "linkset": [
        {
          "anchor": "https://dondlingergc.com/api",
          "service-desc": [
            {
              "href": "https://dondlingergc.com/openapi.json",
              "type": "application/vnd.oai.openapi+json;version=3.1"
            }
          ],
          "service-doc": [
            {
              "href": "https://zla.dondlingergc.com",
              "type": "text/html"
            }
          ],
          "status": [
            {
              "href": "https://dondlingergc.com/api/health",
              "type": "application/json"
            }
          ]
        }
      ]
    };
    const body = JSON.stringify(linksetData, null, 2);
    if (context.waitUntil) {
      context.waitUntil(logDiscoveryHit(context, url.pathname, body.length));
    }
    return new Response(request.method === 'HEAD' ? null : body, {
      status: 200,
      headers: {
        "Content-Type": "application/linkset+json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // 5. Direct RFC 9470 OAuth Protected Resource Metadata handler
  if (url.pathname === '/.well-known/oauth-protected-resource') {
    const prmData = {
      "resource": "https://dondlingergc.com",
      "authorization_servers": ["https://dondlingergc.com"],
      "scopes_supported": ["read", "write", "intake", "dispatch", "telemetry"],
      "bearer_methods_supported": ["header"],
      "resource_documentation": "https://dondlingergc.com/auth.md"
    };
    return new Response(request.method === 'HEAD' ? null : JSON.stringify(prmData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // 6. Direct RFC 8414 OAuth Authorization Server Metadata handler
  if (url.pathname === '/.well-known/oauth-authorization-server') {
    const asData = {
      "issuer": "https://dondlingergc.com",
      "authorization_endpoint": "https://dondlingergc.com/oauth/authorize",
      "token_endpoint": "https://dondlingergc.com/oauth/token",
      "registration_endpoint": "https://dondlingergc.com/oauth/register",
      "revocation_endpoint": "https://dondlingergc.com/api/agent/revoke",
      "response_types_supported": ["code", "token"],
      "grant_types_supported": ["authorization_code", "client_credentials", "urn:ietf:params:oauth:grant-type:token-exchange"],
      "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post", "private_key_jwt", "none"],
      "scopes_supported": ["read", "write", "intake", "dispatch", "telemetry"],
      "service_documentation": "https://dondlingergc.com/auth.md"
    };
    return new Response(request.method === 'HEAD' ? null : JSON.stringify(asData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // 7. Direct Auth.md specification route handler
  if (url.pathname === '/auth.md' || url.pathname === '/auth') {
    const authMdContent = `# Dondlinger GC auth.md\n\nAuthentication and registration discovery specification for autonomous agents interacting with Dondlinger GC services.\n\n- **Resource Server**: \`https://dondlingergc.com\`\n- **Protected Resource Metadata**: \`https://dondlingergc.com/.well-known/oauth-protected-resource\`\n- **Authorization Server Metadata**: \`https://dondlingergc.com/.well-known/oauth-authorization-server\`\n`;
    return new Response(request.method === 'HEAD' ? null : authMdContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const acceptHeader = request.headers.get('accept') || '';
  const userAgent = request.headers.get('user-agent') || '';
  const botCheck = classifyDiscoveryBot(userAgent);
  const response = await next();
  const linkHeaderVal = '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", </openapi.json>; rel="service-desc"; type="application/json", <https://zla.dondlingergc.com>; rel="service-doc"; type="text/html", </auth.md>; rel="describedby"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/plain", </hive/catalog.json>; rel="service-desc"; type="application/json", </hive/llms-full.txt>; rel="alternate"; type="text/plain"';

  // If a known AI crawler or scraper fetches any non-Hive 200 OK page on dondlingergc.com, log it to scraper_hive_events
  // (/hive/* routes are already logged with exact byte counts by functions/hive/[[catchall]].js)
  if (botCheck.isBot && response.status === 200 && !url.pathname.startsWith('/hive') && context.waitUntil) {
    const contentLength = parseInt(response.headers.get('content-length') || '12000', 10) || 12000;
    context.waitUntil(logDiscoveryHit(context, url.pathname, contentLength));
  }

  // If response is HTML and markdown requested, convert to text/markdown
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    if (acceptHeader.includes('text/markdown')) {
      const html = await response.text();
      const markdown = htmlToMarkdown(html, request.url);
      const tokenEstimate = Math.ceil(markdown.length / 4);

      if (context.waitUntil) {
        context.waitUntil(logDiscoveryHit(context, `${url.pathname} [text/markdown]`, markdown.length));
      }

      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/markdown; charset=utf-8');
      headers.set('Vary', 'Accept');
      headers.set('x-markdown-tokens', tokenEstimate.toString());
      if (url.pathname === '/' || url.pathname === '/index.html' || !headers.has('Link')) {
        headers.set('Link', linkHeaderVal);
      }

      return new Response(request.method === 'HEAD' ? null : markdown, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } else if (url.pathname === '/' || url.pathname === '/index.html') {
      const headers = new Headers(response.headers);
      headers.set('Link', linkHeaderVal);
      return new Response(request.method === 'HEAD' ? null : response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }
  }

  return response;
}
