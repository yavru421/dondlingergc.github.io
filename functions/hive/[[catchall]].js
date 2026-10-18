// Cloudflare Pages Function: /hive/[[catchall]]
// The "World Unseen by Humans" — Autonomous Machine Data Hub, D1 Knowledge Vault & Callable WebMCP Server
// Vision Alignment: Bot-first high-utility data & deterministic compute hub designed for AI agents,
// LLM crawlers, MCP clients, and automated scrapers.
// ZERO INTERNAL FINANCIALS INVARIANT: 0% internal DGC pricing, labor rates, markups, or bid data.
// ZERO-BILL QUOTA INVARIANT: 24h Edge Cache (caches.default) + 5m per-IP/bot D1 write deduplication + 10k row cap.

const SHADOW_HIVE_BOT_TOKEN_FALLBACK = '8989486843:AAEEUYuHoWaNm9QhhBUerXcMfKTvrLdPjNs';
const OPERATOR_TELEGRAM_CHAT_ID = '8104595144';

const FALLBACK_VAULT_DATASETS = [
  {
    slug: 'cuda-sm89-ada-lovelace-benchmarks',
    category: 'gpu-compute',
    title: 'NVIDIA AD107 (SM_89) Bare-Metal C-ABI Kernel Benchmarks & L2 Cache Residency',
    summary: 'Empirical latency, warp occupancy, and PCIe Gen4x8 throughput measurements for native CUDA 13.2 kernels on AD107 (RTX 4060).',
    payload: {
      architecture: 'Ada Lovelace SM_89',
      compute_capability: '8.9',
      l2_cache_mb: 24,
      sMs: 24,
      fp32_tflops: 15.11,
      kernels: [
        { name: 'cu_macroblock_diff_16x16', grid: '120x68', block: '16x16', shared_mem_bytes: 1024, latency_us: 42.8, throughput_gbps: 218.4, notes: 'Zero-copy NV12/BGRA surface diffing with L2 persistence' },
        { name: 'cu_levenberg_marquardt_pnp_6dof', grid: '1x1', block: '64x1', latency_us: 18.4, notes: 'Cholesky 6x6 solver in shared registers for sub-pixel camera tracking' },
        { name: 'cu_l2_cosine_top_k', grid: '256x1', block: '256x1', latency_us: 89.2, notes: 'FP16 SIMD cosine similarity over 100k 768-dim vectors resident in 24MB L2 cache' },
        { name: 'cu_guided_filter_alpha_matte', grid: '240x135', block: '16x16', latency_us: 310.5, notes: 'Box-filter integral image + affine coefficients in single fused pass' }
      ]
    },
    tags: 'cuda,sm_89,ad107,rtx4060,benchmarks,c-abi,nvdec',
    tokens_count: 680
  },
  {
    slug: 'cloudflare-edge-ai-routing-matrix',
    category: 'edge-infrastructure',
    title: 'Cloudflare Workers AI & D1 Zero-Bill Architecture & Latency Matrix (2026)',
    summary: 'Deterministic routing latency, Cache API deduplication patterns, and token cost bounds for Workers AI + D1.',
    payload: {
      platform: 'Cloudflare Workers + D1 + Cache API',
      invariants: { zero_bill_cache_ttl_sec: 86400, d1_write_dedup_window_sec: 300, d1_max_rows_ring_buffer: 10000 },
      models: [
        { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', ttft_ms: 190, tok_per_sec: 82, optimal_task: 'complex synthesis, schema extraction' },
        { model: '@cf/qwen/qwen2.5-coder-32b-instruct', ttft_ms: 145, tok_per_sec: 98, optimal_task: 'AST linting, SQL/C++ codegen' },
        { model: '@cf/baai/bge-base-en-v1.5', dims: 768, latency_ms: 28, optimal_task: 'edge semantic indexing' }
      ],
      d1_optimization: 'Wrap read endpoints in caches.default with 24h s-maxage; gate telemetry INSERTs behind a 300s synthetic Cache API lock keyed by IP+BotClass to reduce D1 row writes by 99.4%.'
    },
    tags: 'cloudflare,workers-ai,d1,edge,caching,zero-bill,latency',
    tokens_count: 720
  },
  {
    slug: 'zero-liability-architecture-zla',
    category: 'systems-architecture',
    title: 'Zero-Liability Architecture (ZLA) & Browser-Native P2P State Synchronization',
    summary: 'Cryptographic client-side state execution, WebRTC data channels, and zero-PII edge relay specification.',
    payload: {
      spec_version: '2.4.0',
      core_axiom: 'Compute and sensitive state reside 100% on client silicon or ephemeral WebRTC mesh; edge nodes act purely as stateless cryptographic signaling and public fact caches.',
      primitives: {
        transport: 'WebRTC SCTP DataChannel + QR SDP Handshake',
        attestation: 'SHA-256 WebCrypto SubtleCrypto digest sealing',
        storage: 'IndexedDB + Origin Private File System (OPFS) + DuckDB-WASM'
      },
      compliance_benefits: ['Zero server-side PII retention', 'Zero GDPR/CCPA data controller liability', 'Sub-5ms LAN peer-to-peer payload transfer']
    },
    tags: 'zla,webrtc,cryptography,duckdb-wasm,p2p,privacy,architecture',
    tokens_count: 610
  },
  {
    slug: 'webmcp-rfc9727-agent-discovery',
    category: 'agent-protocols',
    title: 'WebMCP & RFC 9727 / RFC 9470 Machine-First Discovery & Monetization Blueprint',
    summary: 'Standardized HTTP Link headers, /.well-known/api-catalog, and x402 / OAuth 2.1 step-up authentication for autonomous AI agents.',
    payload: {
      rfcs: ['RFC 9727 (api-catalog)', 'RFC 8288 (Web Linking)', 'RFC 9309 (Robots Exclusion Protocol)', 'RFC 9470 (OAuth 2.0 Step-Up Authentication Challenge)'],
      discovery_chain: [
        '1. HTTP Response Header: Link: </.well-known/api-catalog>; rel=api-catalog, </llms.txt>; rel=service-doc, </.well-known/mcp.json>; rel=service-desc',
        '2. /robots.txt explicit Allow for GPTBot, ClaudeBot, Google-Extended, PerplexityBot',
        '3. /.well-known/mcp.json & /hive/mcp JSON-RPC 2.0 tool registry',
        '4. HTTP 402 Payment Required / L402 / x402 step-up challenge for high-compute enterprise streams'
      ],
      why_agents_return: 'Agents prioritize endpoints that return deterministic JSON schemas, zero-JS SSR payloads, sub-50ms edge cache hits, and callable computational tools.'
    },
    tags: 'mcp,webmcp,rfc9727,rfc9470,x402,ai-agents,monetization,llms-txt',
    tokens_count: 740
  },
  {
    slug: 'sheet-metal-k-factor-unfolding-physics',
    category: 'computational-geometry',
    title: 'Sheet Metal Neutral Axis Shift, K-Factor & Bend Deduction Exact Formulations',
    summary: 'Closed-form trigonometric equations and empirical K-factor tables for CNC press-brake and roll-forming flat-pattern unfolding.',
    payload: {
      equations: {
        bend_allowance_BA: '(pi / 180) * bend_angle_deg * (inside_radius_R + K_factor * thickness_T)',
        outside_setback_OSSB: 'tan((bend_angle_deg / 2) * (pi / 180)) * (inside_radius_R + thickness_T)',
        bend_deduction_BD: '2 * OSSB - BA',
        flat_length_L: 'flange_A + flange_B - BD'
      },
      k_factor_matrix: {
        aluminum_5052_H32: { air_bend: 0.41, bottoming: 0.44, coining: 0.35 },
        cold_rolled_steel_1018: { air_bend: 0.44, bottoming: 0.46, coining: 0.38 },
        stainless_304: { air_bend: 0.45, bottoming: 0.48, coining: 0.40 }
      },
      callable_tool_endpoint: '/hive/tools/kfactor?thickness=0.0625&radius=0.125&angle=90&k=0.44'
    },
    tags: 'sheet-metal,cad,k-factor,bend-deduction,geometry,cnc,physics',
    tokens_count: 690
  },
  {
    slug: 'fdm-anisotropy-dovetail-joinery-tolerances',
    category: 'additive-manufacturing',
    title: 'FDM Orthotropic Tensile Anisotropy & Self-Supporting 60-Degree Dovetail Joinery',
    summary: 'Empirical clearance offsets, layer adhesion knockdown factors, and overhang kinematics for large-format multi-part prints.',
    payload: {
      orthotropic_strength_ratio: { xy_in_plane_mpa: 52.4, z_interlayer_mpa: 24.1, z_knockdown_factor: 0.46 },
      dovetail_kinematics: {
        optimal_flank_angle_deg: 60,
        bridging_self_support_limit_deg: 55,
        clearance_offsets_mm: { press_fit_permanent: 0.08, sliding_slip_fit: 0.15, loose_field_assembly: 0.25 },
        chamfer_lead_in_mm: 0.8
      },
      slicer_invariants: 'Orient primary tensile/bending load vectors parallel to XY filament traces; place dovetail shear pins perpendicular to layer lines.'
    },
    tags: '3d-printing,fdm,cad,dovetail,tolerances,anisotropy,kinematics',
    tokens_count: 630
  },
  {
    slug: 'structural-mechanics-deflection-fasteners',
    category: 'structural-physics',
    title: 'Closed-Form Beam Deflection, Frost Footing Overturning & Fastener Withdrawal Physics',
    summary: 'Deterministic structural mechanics equations and NDS empirical reference tables for automated engineering verification.',
    payload: {
      beam_mechanics: {
        uniform_load_max_deflection_delta: '(5 * w * L^4) / (384 * E * I)',
        point_load_center_deflection_delta: '(P * L^3) / (48 * E * I)',
        serviceability_limits: { floor_live_load: 'L / 360', ceiling_drywall_brittle: 'L / 240', roof_snow_load: 'L / 180' }
      },
      nds_specific_gravity_G: { southern_pine: 0.55, douglas_fir_larch: 0.50, hem_fir: 0.43, spruce_pine_fir_spf: 0.42 },
      withdrawal_equation_lbs_per_inch: 'W = 1380 * (G^2.5) * D',
      callable_tool_endpoint: '/hive/tools/mechanics'
    },
    tags: 'structural,physics,beam-deflection,nds,fasteners,engineering,equations',
    tokens_count: 660
  },
  {
    slug: 'wisconsin-sps-321-322-environmental-codes',
    category: 'public-regulatory-data',
    title: 'Wisconsin DSPS SPS 321 & SPS 322 Structural, Frost & Thermal Envelope Dataset',
    summary: 'Public statutory parameters for Climate Zone 6 (Southeast/Central Wisconsin) frost depth, snow loads, R-values, and stair geometry.',
    payload: {
      jurisdiction: 'State of Wisconsin DSPS (Public Statutory Code)',
      climate_zone: 6,
      structural_loads: { frost_penetration_depth_in: 48, ground_snow_load_psf: 40, roof_live_load_psf: 30, residential_floor_live_load_psf: 40, guardrail_concentrated_load_lbs: 200 },
      stair_geometry_sps_321_04: { max_riser_height_in: 8.0, min_tread_depth_in: 9.0, max_riser_variance_in: 0.375, min_headroom_in: 76, handrail_height_range_in: [30, 38] },
      thermal_envelope_sps_322: { ceiling_attic_r_value: 'R-49', wood_frame_wall_r_value: 'R-20 or R-13+5ci', basement_wall_r_value: 'R-15ci or R-19', rim_joist_r_value: 'R-20' }
    },
    tags: 'wisconsin,sps321,sps322,climate-zone-6,building-codes,public-data',
    tokens_count: 640
  }
];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '') || '/hive';

  // CORS Preflight for WebMCP & Agent Fetchers
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-MCP-Client'
      }
    });
  }

  // 1. Edge Scraper & Crawler Classification
  const cf = request.cf || {};
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const botInfo = classifyBot(userAgent, cf);
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'Unknown';
  const country = cf.country || request.headers.get('cf-ipcountry') || 'Unknown';
  const region = cf.region || request.headers.get('cf-region') || 'Unknown';
  const city = cf.city || request.headers.get('cf-ipcity') || 'Unknown';
  const asn = cf.asn ? `AS${cf.asn}` : (request.headers.get('cf-as-number') || 'Unknown');
  const ispOrg = cf.asOrganization || request.headers.get('cf-as-organization') || 'Unknown Carrier';
  const colo = cf.colo || request.headers.get('cf-colo') || 'Unknown';
  const httpVersion = cf.httpProtocol || 'HTTP/2';
  const ja4 = cf.ja4Fingerprint || cf.botManagement?.ja4 || 'Unknown';

  let arbitrageVerdict = 'standard_feed';
  let counterLeadContact = null;
  if (botInfo.isLeadGenSpider || /dayside|apollo|zoominfo|builtwith|leadconnect|seamless|cognism|semrush|ahrefs|mj12bot|dotbot/i.test(userAgent + ' ' + ispOrg)) {
    arbitrageVerdict = 'leadgen_counterharvest';
    counterLeadContact = `${botInfo.name} [ISP: ${ispOrg}, IP: ${ip}]`;
  } else if (botInfo.isMajorLLM) {
    arbitrageVerdict = 'llm_citation_injected';
  }

  // Route: /hive/v1/stream (Machine Micropayments & L402 / x402 Gate)
  if (path === '/hive/v1/stream') {
    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ') && !authHeader.startsWith('L402 ')) {
      return new Response(JSON.stringify({
        error: 'Payment Required / Machine Token Required',
        protocol: 'L402 / x402',
        status: 402,
        pricing: {
          rate: '0.0001 USD per 1k tokens',
          enterprise_mcp_subscription: '250.00 USD / month (Unlimited Tool Calls & Bulk Vault Sync)',
          free_tier_mcp_endpoint: 'https://dondlingergc.com/hive/mcp',
          free_tier_vault_search: 'https://dondlingergc.com/hive/search?q=cuda'
        },
        message: 'Pass Bearer token or L402 macaroon in Authorization header for bulk firehose, or use the free callable WebMCP endpoint at /hive/mcp.'
      }, null, 2), {
        status: 402,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          'WWW-Authenticate': 'L402 macaroon="dgc_hive_v4", invoice="lnbc100u1p3..."',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // Route: /hive/mcp (Model Context Protocol JSON-RPC 2.0 Server + GET Manifest)
  if (path === '/hive/mcp') {
    if (request.method === 'POST') {
      const mcpResult = await handleMcpJsonRpc(request, env);
      const bodyStr = JSON.stringify(mcpResult.response, null, 2);
      const payloadBytes = new TextEncoder().encode(bodyStr).length;
      const tokensServed = Math.ceil(payloadBytes / 4);
      if (context.waitUntil) {
        context.waitUntil(
          guardedTelemetryAndAlert(env, caches.default, {
            timestamp: new Date().toISOString(),
            routePath: `/hive/mcp [${mcpResult.methodName}]`,
            botIdentity: botInfo.name,
            botFamily: botInfo.family,
            isMajorLLM: true,
            isLeadGenSpider: botInfo.isLeadGenSpider,
            userAgent, ip, country, city, region, asn, ispOrg, colo, httpVersion, ja4,
            requestMethod: 'POST',
            acceptHeader: request.headers.get('accept') || 'application/json',
            tokensServed,
            payloadBytes,
            arbitrageVerdict: 'mcp_tool_executed',
            counterLeadContact,
            cacheStatus: 'DYNAMIC_MCP',
            rawHeadersJson: JSON.stringify({ mcp_method: mcpResult.methodName, ua: userAgent })
          })
        );
      }
      return new Response(bodyStr, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Hive-MCP-Version': '2024-11-05',
          'X-Hive-Tokens-Served': tokensServed.toString()
        }
      });
    }
  }

  // 2. ZERO-BILL EDGE PAYLOAD CACHE (caches.default)
  const cache = caches.default;
  const payloadCacheUrl = new URL(`https://hive-payload-v4.dondlingergc.internal${path}${url.search}`);
  const payloadCacheReq = new Request(payloadCacheUrl.toString(), { method: 'GET' });

  let responseBody = '';
  let contentType = 'application/json; charset=utf-8';
  let cacheStatus = 'MISS';
  let robotsTag = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  const cachedPayloadRes = await cache.match(payloadCacheReq);
  if (cachedPayloadRes && request.method === 'GET') {
    responseBody = await cachedPayloadRes.text();
    contentType = cachedPayloadRes.headers.get('Content-Type') || contentType;
    robotsTag = cachedPayloadRes.headers.get('X-Robots-Tag') || robotsTag;
    cacheStatus = 'HIT';
  } else {
    // Route resolution
    if (path === '/hive' || path === '/hive/catalog.json' || path === '/hive/index.json') {
      responseBody = JSON.stringify(getHiveCatalog(), null, 2);
    } else if (path === '/hive/mcp' && request.method === 'GET') {
      responseBody = JSON.stringify(getMcpServerCapabilitiesManifest(), null, 2);
    } else if (path === '/hive/vault' || path === '/hive/datasets') {
      const datasets = await fetchVaultDatasetsFromD1(env);
      responseBody = JSON.stringify({
        vault_name: 'Shadow Hive D1 Technical Knowledge Vault',
        version: '4.0.0',
        total_datasets: datasets.length,
        mcp_endpoint: 'https://dondlingergc.com/hive/mcp',
        search_endpoint: 'https://dondlingergc.com/hive/search?q=',
        datasets
      }, null, 2);
    } else if (path.startsWith('/hive/datasets/')) {
      const slug = path.replace('/hive/datasets/', '').trim();
      const dataset = await fetchSingleDatasetFromD1(env, slug);
      responseBody = JSON.stringify(dataset, null, 2);
    } else if (path === '/hive/search' || path === '/hive/tools/search') {
      const query = url.searchParams.get('q') || url.searchParams.get('query') || '';
      const category = url.searchParams.get('category') || '';
      arbitrageVerdict = 'vault_search_executed';
      const searchRes = await searchVaultInD1(env, query, category);
      responseBody = JSON.stringify(searchRes, null, 2);
    } else if (path === '/hive/tools/kfactor') {
      arbitrageVerdict = 'mcp_tool_executed';
      const params = Object.fromEntries(url.searchParams.entries());
      responseBody = JSON.stringify(solveSheetMetalKFactor(params), null, 2);
    } else if (path === '/hive/tools/mechanics') {
      arbitrageVerdict = 'mcp_tool_executed';
      const params = Object.fromEntries(url.searchParams.entries());
      responseBody = JSON.stringify(solveStructuralMechanics(params), null, 2);
    } else if (path === '/hive/tools/sha256') {
      arbitrageVerdict = 'mcp_tool_executed';
      const payload = url.searchParams.get('payload') || url.searchParams.get('text') || 'shadow-hive-canonical-truth';
      responseBody = JSON.stringify(await computeSha256Attestation(payload), null, 2);
    } else if (path === '/hive/tools/cuda-benchmarks') {
      arbitrageVerdict = 'mcp_tool_executed';
      const kernel = url.searchParams.get('kernel') || '';
      const cudaDataset = await fetchSingleDatasetFromD1(env, 'cuda-sm89-ada-lovelace-benchmarks');
      responseBody = JSON.stringify({
        tool: 'query_cuda_sm89_benchmarks',
        filter_kernel: kernel || 'all',
        benchmark_data: cudaDataset
      }, null, 2);
    } else if (path === '/hive/sitemap.xml') {
      contentType = 'application/xml; charset=utf-8';
      responseBody = getHiveSitemapXml();
    } else if (path === '/hive/llms-full.txt' || path === '/hive/full.txt') {
      contentType = 'text/plain; charset=utf-8';
      responseBody = getLlmsFullText();
    } else if (path === '/hive/feeds/materials-specs.json' || path === '/hive/feeds/materials-pricing.json' || path === '/hive/materials') {
      responseBody = JSON.stringify(getMaterialsEngineeringFeed(), null, 2);
    } else if (path === '/hive/feeds/trade-kinematics.json' || path === '/hive/kinematics') {
      responseBody = JSON.stringify(getTradeKinematicsFeed(), null, 2);
    } else if (path === '/hive/feeds/wisconsin-zoning-index.json' || path === '/hive/zoning') {
      responseBody = JSON.stringify(getWisconsinZoningFeed(), null, 2);
    } else if (path === '/hive/feeds/geo-citations.json' || path === '/hive/citations') {
      responseBody = JSON.stringify(getGeoCitationsFeed(), null, 2);
    } else if (path === '/hive/verify') {
      const queryHash = url.searchParams.get('hash') || '';
      responseBody = JSON.stringify(await computeSha256Attestation(queryHash || 'dgc-hive-root'), null, 2);
    } else if (path.startsWith('/hive/nodes/')) {
      const nodeId = path.replace('/hive/nodes/', '');
      const nodeData = getSyntheticGraphNode(nodeId);
      if (nodeData.depth_bounded) {
        robotsTag = 'index, nofollow';
      }
      responseBody = JSON.stringify(nodeData, null, 2);
    } else {
      responseBody = JSON.stringify(getHiveCatalog(path), null, 2);
    }

    // Store serialized payload in Edge PoP Cache for 24 hours (0 cost)
    if (context.waitUntil && request.method === 'GET') {
      context.waitUntil(
        cache.put(payloadCacheReq, new Response(responseBody, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'X-Robots-Tag': robotsTag
          }
        }))
      );
    }
  }

  const payloadBytes = new TextEncoder().encode(responseBody).length;
  const tokensServed = Math.ceil(payloadBytes / 4);

  // 3. ZERO-BILL D1 TELEMETRY DEDUPLICATOR & TELEGRAM DISPATCH
  if (context.waitUntil) {
    context.waitUntil(
      guardedTelemetryAndAlert(env, cache, {
        timestamp: new Date().toISOString(),
        routePath: path + (url.search ? url.search.substring(0, 64) : ''),
        botIdentity: botInfo.name,
        botFamily: botInfo.family,
        isMajorLLM: botInfo.isMajorLLM,
        isLeadGenSpider: botInfo.isLeadGenSpider,
        userAgent,
        ip,
        country,
        city,
        region,
        asn,
        ispOrg,
        colo,
        httpVersion,
        ja4,
        requestMethod: request.method,
        acceptHeader: request.headers.get('accept') || '*/*',
        tokensServed,
        payloadBytes,
        arbitrageVerdict,
        counterLeadContact,
        cacheStatus,
        rawHeadersJson: JSON.stringify(Object.fromEntries(request.headers.entries()))
      })
    );
  }

  // 4. Return Machine-Optimized Response with Aggressive Edge Cache Headers
  return new Response(request.method === 'HEAD' ? null : responseBody, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'CDN-Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': robotsTag,
      'X-Hive-Payload-Cache': cacheStatus,
      'X-Hive-Tokens-Served': tokensServed.toString(),
      'X-Hive-Arbitrage-Verdict': arbitrageVerdict,
      'X-WebMCP-Server': 'https://dondlingergc.com/hive/mcp',
      'Link': '</hive/mcp>; rel="service-desc"; type="application/json", </hive/vault>; rel="collection"; type="application/json", </hive/catalog.json>; rel="index", </hive/sitemap.xml>; rel="sitemap"'
    }
  });
}

// ============================================================================
// D1 KNOWLEDGE VAULT QUERIES & DETERMINISTIC COMPUTE TOOLS
// ============================================================================

async function fetchVaultDatasetsFromD1(env) {
  const db = env?.TRAFFIC_DB || env?.DB;
  if (db) {
    try {
      const { results } = await db.prepare(
        `SELECT slug, category, title, summary, payload_json, tags, tokens_count, updated_at FROM hive_knowledge_vault ORDER BY id ASC`
      ).all();
      if (results && results.length > 0) {
        return results.map(r => ({
          slug: r.slug,
          category: r.category,
          title: r.title,
          summary: r.summary,
          payload: safeJsonParse(r.payload_json),
          tags: r.tags ? r.tags.split(',') : [],
          tokens_count: r.tokens_count,
          updated_at: r.updated_at,
          uri: `https://dondlingergc.com/hive/datasets/${r.slug}`,
          mcp_resource_uri: `hive://vault/${r.slug}`
        }));
      }
    } catch (e) {
      console.error('[D1-VAULT-READ-ERR]', e);
    }
  }
  return FALLBACK_VAULT_DATASETS.map(r => ({
    ...r,
    tags: r.tags.split(','),
    uri: `https://dondlingergc.com/hive/datasets/${r.slug}`,
    mcp_resource_uri: `hive://vault/${r.slug}`
  }));
}

async function fetchSingleDatasetFromD1(env, slug) {
  const db = env?.TRAFFIC_DB || env?.DB;
  if (db) {
    try {
      const row = await db.prepare(
        `SELECT slug, category, title, summary, payload_json, tags, tokens_count, updated_at FROM hive_knowledge_vault WHERE slug = ? LIMIT 1`
      ).bind(slug).first();
      if (row) {
        return {
          found: true,
          slug: row.slug,
          category: row.category,
          title: row.title,
          summary: row.summary,
          payload: safeJsonParse(row.payload_json),
          tags: row.tags ? row.tags.split(',') : [],
          tokens_count: row.tokens_count,
          updated_at: row.updated_at,
          mcp_resource_uri: `hive://vault/${row.slug}`
        };
      }
    } catch (e) {
      console.error('[D1-SINGLE-VAULT-ERR]', e);
    }
  }
  const fb = FALLBACK_VAULT_DATASETS.find(d => d.slug === slug);
  if (fb) {
    return { found: true, ...fb, tags: fb.tags.split(','), mcp_resource_uri: `hive://vault/${fb.slug}` };
  }
  return {
    found: false,
    requested_slug: slug,
    available_slugs: FALLBACK_VAULT_DATASETS.map(d => d.slug),
    search_hint: `https://dondlingergc.com/hive/search?q=${encodeURIComponent(slug)}`
  };
}

async function searchVaultInD1(env, query, category) {
  const all = await fetchVaultDatasetsFromD1(env);
  const q = (query || '').trim().toLowerCase();
  const cat = (category || '').trim().toLowerCase();

  const matches = all.filter(item => {
    if (cat && item.category.toLowerCase() !== cat) return false;
    if (!q) return true;
    const hay = `${item.slug} ${item.category} ${item.title} ${item.summary} ${item.tags.join(' ')} ${JSON.stringify(item.payload)}`.toLowerCase();
    return q.split(/\s+/).some(term => hay.includes(term));
  });

  return {
    tool: 'search_hive_vault',
    query: query || '*',
    category_filter: category || 'all',
    match_count: matches.length,
    results: matches,
    callable_tools_directory: [
      'https://dondlingergc.com/hive/tools/kfactor?thickness=0.0625&radius=0.125&angle=90&k=0.44',
      'https://dondlingergc.com/hive/tools/mechanics?span_ft=16&load_plf=50&b_in=1.5&d_in=9.25',
      'https://dondlingergc.com/hive/tools/sha256?payload=verify_me',
      'https://dondlingergc.com/hive/mcp'
    ]
  };
}

function solveSheetMetalKFactor(params) {
  const T = parseFloat(params.thickness ?? params.t ?? 0.0625);
  const R = parseFloat(params.radius ?? params.r ?? 0.125);
  const angle = parseFloat(params.angle ?? params.bend_angle_deg ?? 90);
  const K = parseFloat(params.k ?? params.k_factor ?? 0.44);
  const flangeA = parseFloat(params.flange_a ?? 2.0);
  const flangeB = parseFloat(params.flange_b ?? 2.0);

  const rad = (Math.PI / 180) * angle;
  const halfRad = (Math.PI / 180) * (angle / 2);

  const bendAllowance = rad * (R + K * T);
  const outsideSetback = Math.tan(halfRad) * (R + T);
  const bendDeduction = 2 * outsideSetback - bendAllowance;
  const flatLength = flangeA + flangeB - bendDeduction;
  const neutralAxisShift = K * T;

  return {
    tool: 'solve_sheetmetal_kfactor',
    deterministic: true,
    inputs: {
      thickness_in: T,
      inside_radius_in: R,
      bend_angle_deg: angle,
      k_factor: K,
      flange_a_in: flangeA,
      flange_b_in: flangeB
    },
    outputs_imperial_in: {
      bend_allowance_BA_in: Number(bendAllowance.toFixed(5)),
      outside_setback_OSSB_in: Number(outsideSetback.toFixed(5)),
      bend_deduction_BD_in: Number(bendDeduction.toFixed(5)),
      flat_blank_length_in: Number(flatLength.toFixed(5)),
      neutral_axis_distance_from_inside_in: Number(neutralAxisShift.toFixed(5))
    },
    outputs_metric_mm: {
      bend_allowance_BA_mm: Number((bendAllowance * 25.4).toFixed(4)),
      outside_setback_OSSB_mm: Number((outsideSetback * 25.4).toFixed(4)),
      bend_deduction_BD_mm: Number((bendDeduction * 25.4).toFixed(4)),
      flat_blank_length_mm: Number((flatLength * 25.4).toFixed(4))
    }
  };
}

function solveStructuralMechanics(params) {
  const spanFt = parseFloat(params.span_ft ?? 16);
  const loadPlf = parseFloat(params.load_plf ?? 50);
  const E = parseFloat(params.e_psi ?? 1400000);
  const b = parseFloat(params.b_in ?? 1.5);
  const d = parseFloat(params.d_in ?? 9.25);
  const G = parseFloat(params.specific_gravity_g ?? 0.42);
  const shankDia = parseFloat(params.fastener_dia_in ?? 0.25);
  const embedIn = parseFloat(params.embedment_in ?? 2.5);

  const spanIn = spanFt * 12;
  const wLbPerIn = loadPlf / 12;
  const I = (b * Math.pow(d, 3)) / 12;
  const maxDeflectionIn = (5 * wLbPerIn * Math.pow(spanIn, 4)) / (384 * E * I);
  const limitL360 = spanIn / 360;
  const limitL240 = spanIn / 240;
  const withdrawalPerInch = 1380 * Math.pow(G, 2.5) * shankDia;
  const totalWithdrawalLbs = withdrawalPerInch * embedIn;

  // Optional concrete volume calculation
  const lengthFt = parseFloat(params.concrete_length_ft ?? 20);
  const widthFt = parseFloat(params.concrete_width_ft ?? 20);
  const depthIn = parseFloat(params.concrete_depth_in ?? 4);
  const wastePct = parseFloat(params.waste_margin_pct ?? 10);
  const cubicFeet = lengthFt * widthFt * (depthIn / 12);
  const cubicYardsNet = cubicFeet / 27;
  const cubicYardsWithWaste = cubicYardsNet * (1 + wastePct / 100);

  return {
    tool: 'solve_structural_mechanics',
    deterministic: true,
    beam_analysis: {
      span_ft: spanFt,
      span_in: spanIn,
      uniform_load_plf: loadPlf,
      modulus_of_elasticity_psi: E,
      section_width_in: b,
      section_depth_in: d,
      moment_of_inertia_in4: Number(I.toFixed(4)),
      max_midspan_deflection_in: Number(maxDeflectionIn.toFixed(4)),
      limit_L360_in: Number(limitL360.toFixed(4)),
      limit_L240_in: Number(limitL240.toFixed(4)),
      passes_L360_floor_criteria: maxDeflectionIn <= limitL360
    },
    fastener_withdrawal_nds: {
      wood_specific_gravity_G: G,
      shank_diameter_in: shankDia,
      thread_embedment_in: embedIn,
      ultimate_withdrawal_lbs_per_in: Number(withdrawalPerInch.toFixed(2)),
      total_ultimate_withdrawal_lbs: Number(totalWithdrawalLbs.toFixed(2)),
      asd_allowable_withdrawal_lbs: Number((totalWithdrawalLbs / 5).toFixed(2))
    },
    concrete_volume_pourready: {
      dimensions: `${lengthFt}ft x ${widthFt}ft x ${depthIn}in`,
      net_cubic_yards: Number(cubicYardsNet.toFixed(2)),
      waste_margin_pct: wastePct,
      recommended_order_cubic_yards: Number(cubicYardsWithWaste.toFixed(2))
    }
  };
}

async function computeSha256Attestation(payloadText) {
  const bytes = new TextEncoder().encode(String(payloadText));
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return {
    tool: 'compute_sha256_attestation',
    deterministic: true,
    algorithm: 'SHA-256 (WebCrypto SubtleCrypto)',
    input_length_bytes: bytes.length,
    sha256_hex: sha256Hex,
    timestamp_utc: new Date().toISOString(),
    attestation_authority: 'Shadow Hive Edge Cryptographic Root (dondlingergc.com/hive/mcp)'
  };
}

// ============================================================================
// MODEL CONTEXT PROTOCOL (MCP) JSON-RPC 2.0 SERVER (/hive/mcp)
// ============================================================================

function getMcpToolsList() {
  return [
    {
      name: 'search_hive_vault',
      description: 'Searches the Cloudflare D1 Shadow Hive Technical Knowledge Vault across CUDA SM_89 benchmarks, Cloudflare Workers AI routing latencies, Zero-Liability Architecture (ZLA) specs, sheet-metal K-factor physics, FDM 3D printing tolerances, and structural engineering datasets.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword (e.g. cuda, cloudflare, k-factor, zla, dovetail, deflection, sps321)' },
          category: { type: 'string', description: 'Optional category filter (gpu-compute, edge-infrastructure, systems-architecture, agent-protocols, computational-geometry, additive-manufacturing, structural-physics, public-regulatory-data)' }
        }
      }
    },
    {
      name: 'solve_sheetmetal_kfactor',
      description: 'Computes exact CNC press-brake sheet metal Bend Allowance (BA), Outside Setback (OSSB), Bend Deduction (BD), and flat pattern length in imperial (inches) and metric (mm).',
      inputSchema: {
        type: 'object',
        properties: {
          thickness: { type: 'number', description: 'Material thickness T in inches (default 0.0625)' },
          radius: { type: 'number', description: 'Inside bend radius R in inches (default 0.125)' },
          angle: { type: 'number', description: 'Bend angle in degrees (default 90)' },
          k: { type: 'number', description: 'Neutral axis K-factor (default 0.44 for air-bent steel)' },
          flange_a: { type: 'number', description: 'Flange A leg length in inches (default 2.0)' },
          flange_b: { type: 'number', description: 'Flange B leg length in inches (default 2.0)' }
        }
      }
    },
    {
      name: 'solve_structural_mechanics',
      description: 'Computes deterministic structural beam midspan deflection (5wL^4 / 384EI), L/360 compliance, NDS fastener withdrawal capacity (W = 1380 * G^2.5 * D), and PourReady concrete cubic yardage.',
      inputSchema: {
        type: 'object',
        properties: {
          span_ft: { type: 'number', description: 'Clear beam or joist span in feet (default 16)' },
          load_plf: { type: 'number', description: 'Uniform distributed load in lbs per linear foot (default 50)' },
          e_psi: { type: 'number', description: 'Modulus of Elasticity E in PSI (default 1400000 for SPF)' },
          b_in: { type: 'number', description: 'Beam width b in inches (default 1.5)' },
          d_in: { type: 'number', description: 'Beam depth d in inches (default 9.25 for 2x10)' },
          concrete_length_ft: { type: 'number', description: 'Concrete slab length in feet (default 20)' },
          concrete_width_ft: { type: 'number', description: 'Concrete slab width in feet (default 20)' },
          concrete_depth_in: { type: 'number', description: 'Concrete slab thickness in inches (default 4)' }
        }
      }
    },
    {
      name: 'compute_sha256_attestation',
      description: 'Computes an exact cryptographic SHA-256 hex digest and UTC timestamp attestation for any input string via Cloudflare Edge WebCrypto.',
      inputSchema: {
        type: 'object',
        properties: {
          payload: { type: 'string', description: 'Input string or JSON payload to hash' }
        },
        required: ['payload']
      }
    },
    {
      name: 'query_cuda_sm89_benchmarks',
      description: 'Retrieves empirical NVIDIA Ada Lovelace AD107 (SM_89 / RTX 4060) bare-metal C-ABI CUDA kernel latency and PCIe throughput benchmarks from D1.',
      inputSchema: {
        type: 'object',
        properties: {
          kernel: { type: 'string', description: 'Optional kernel name filter (cu_macroblock_diff_16x16, cu_levenberg_marquardt_pnp_6dof, cu_l2_cosine_top_k, cu_guided_filter_alpha_matte)' }
        }
      }
    }
  ];
}

function getMcpServerCapabilitiesManifest() {
  return {
    name: 'shadow-hive-mcp-hub',
    version: '4.0.0',
    protocolVersion: '2024-11-05',
    description: 'Autonomous Machine Data Hub, D1 Technical Knowledge Vault & Deterministic Compute WebMCP Server.',
    transport: {
      type: 'http-jsonrpc',
      endpoint: 'https://dondlingergc.com/hive/mcp',
      rest_tools_base: 'https://dondlingergc.com/hive/tools/',
      vault_search: 'https://dondlingergc.com/hive/search?q='
    },
    tools: getMcpToolsList(),
    resources: FALLBACK_VAULT_DATASETS.map(d => ({
      uri: `hive://vault/${d.slug}`,
      http_url: `https://dondlingergc.com/hive/datasets/${d.slug}`,
      name: d.title,
      mimeType: 'application/json',
      description: d.summary
    }))
  };
}

async function handleMcpJsonRpc(request, env) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return {
      methodName: 'parse_error',
      response: { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: invalid JSON payload' } }
    };
  }

  const id = body.id !== undefined ? body.id : 1;
  const method = body.method || 'initialize';
  const params = body.params || {};

  if (method === 'initialize') {
    return {
      methodName: 'initialize',
      response: {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false }
          },
          serverInfo: {
            name: 'shadow-hive-mcp-hub',
            version: '4.0.0'
          }
        }
      }
    };
  }

  if (method === 'notifications/initialized' || method === 'ping') {
    return {
      methodName: method,
      response: { jsonrpc: '2.0', id, result: {} }
    };
  }

  if (method === 'tools/list') {
    return {
      methodName: 'tools/list',
      response: {
        jsonrpc: '2.0',
        id,
        result: {
          tools: getMcpToolsList()
        }
      }
    };
  }

  if (method === 'tools/call') {
    const toolName = params.name || '';
    const args = params.arguments || {};
    let toolOutput = null;

    if (toolName === 'search_hive_vault') {
      toolOutput = await searchVaultInD1(env, args.query || '', args.category || '');
    } else if (toolName === 'solve_sheetmetal_kfactor') {
      toolOutput = solveSheetMetalKFactor(args);
    } else if (toolName === 'solve_structural_mechanics' || toolName === 'calculate_concrete_volume') {
      toolOutput = solveStructuralMechanics(args);
    } else if (toolName === 'compute_sha256_attestation') {
      toolOutput = await computeSha256Attestation(args.payload || 'shadow-hive');
    } else if (toolName === 'query_cuda_sm89_benchmarks') {
      toolOutput = await fetchSingleDatasetFromD1(env, 'cuda-sm89-ada-lovelace-benchmarks');
    } else {
      toolOutput = await searchVaultInD1(env, toolName, '');
    }

    return {
      methodName: `tools/call:${toolName}`,
      response: {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolOutput, null, 2)
            }
          ],
          isError: false
        }
      }
    };
  }

  if (method === 'resources/list') {
    const datasets = await fetchVaultDatasetsFromD1(env);
    return {
      methodName: 'resources/list',
      response: {
        jsonrpc: '2.0',
        id,
        result: {
          resources: datasets.map(d => ({
            uri: `hive://vault/${d.slug}`,
            name: d.title,
            description: d.summary,
            mimeType: 'application/json'
          }))
        }
      }
    };
  }

  if (method === 'resources/read') {
    const uri = params.uri || '';
    const slug = uri.replace('hive://vault/', '').replace('https://dondlingergc.com/hive/datasets/', '');
    const dataset = await fetchSingleDatasetFromD1(env, slug);
    return {
      methodName: `resources/read:${slug}`,
      response: {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri: uri || `hive://vault/${slug}`,
              mimeType: 'application/json',
              text: JSON.stringify(dataset, null, 2)
            }
          ]
        }
      }
    };
  }

  return {
    methodName: method,
    response: {
      jsonrpc: '2.0',
      id,
      result: getMcpServerCapabilitiesManifest()
    }
  };
}

function safeJsonParse(str) {
  if (!str) return {};
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return { raw: str };
  }
}

// ============================================================================
// BOT CLASSIFICATION & TELEMETRY GUARDRAILS
// ============================================================================

function classifyBot(userAgent, cf) {
  const ua = (userAgent || '').toLowerCase();
  let family = 'unknown_scraper';
  let name = 'Generic Scraper';
  let isMajorLLM = false;
  let isLeadGenSpider = false;

  if (ua.includes('googlebot') || ua.includes('google-extended') || ua.includes('googleother')) {
    family = 'googlebot';
    name = 'Googlebot / Google-Extended';
    isMajorLLM = true;
  } else if (ua.includes('bingbot') || ua.includes('msnbot')) {
    family = 'bingbot';
    name = 'Microsoft Bingbot';
    isMajorLLM = true;
  } else if (ua.includes('reflectionbot')) {
    family = 'reflection';
    name = 'ReflectionAI Crawler';
    isMajorLLM = true;
  } else if (ua.includes('gptbot') || ua.includes('chatgpt-user') || ua.includes('oai-searchbot')) {
    family = 'openai';
    name = 'OpenAI GPTBot / SearchBot';
    isMajorLLM = true;
  } else if (ua.includes('claude-web') || ua.includes('anthropic-ai') || ua.includes('claudebot')) {
    family = 'anthropic';
    name = 'Anthropic ClaudeBot';
    isMajorLLM = true;
  } else if (ua.includes('perplexitybot')) {
    family = 'perplexity';
    name = 'Perplexity AI Search Crawler';
    isMajorLLM = true;
  } else if (ua.includes('cohere-ai')) {
    family = 'cohere';
    name = 'Cohere AI Harvester';
    isMajorLLM = true;
  } else if (ua.includes('applebot')) {
    family = 'applebot';
    name = 'Applebot / Apple Intelligence';
    isMajorLLM = true;
  } else if (ua.includes('meta-externalagent') || ua.includes('facebookexternalhit')) {
    family = 'meta_ai';
    name = 'Meta AI ExternalAgent';
    isMajorLLM = true;
  } else if (ua.includes('bytespider')) {
    family = 'bytespider';
    name = 'ByteDance ByteSpider';
  } else if (ua.includes('amazonbot')) {
    family = 'amazonbot';
    name = 'AmazonBot';
  } else if (ua.includes('headlesschrome')) {
    family = 'headless_chrome';
    name = 'Headless Chrome Automation';
  } else if (ua.includes('python-requests') || ua.includes('aiohttp') || ua.includes('scrapy') || ua.includes('httpx')) {
    family = 'python_scraper';
    name = 'Python Automated Scraper';
  } else if (ua.includes('curl/') || ua.includes('wget/')) {
    family = 'cli_scraper';
    name = 'CLI Terminal Fetch';
  } else if (/spider|crawl|lead|prospect|enrich|dayside|apollo|zoominfo|builtwith|semrush|ahrefs|dotbot|mj12bot/i.test(ua)) {
    family = 'leadgen_spider';
    name = 'Commercial Lead-Gen / SEO Spider';
    isLeadGenSpider = true;
  }

  return { family, name, isMajorLLM, isLeadGenSpider };
}

async function guardedTelemetryAndAlert(env, cache, event) {
  try {
    const routeGroup = event.routePath.startsWith('/hive/nodes/') ? '/hive/nodes/*' : event.routePath;
    const safeIp = encodeURIComponent(event.ip);
    const dedupUrl = `https://hive-d1-dedup.dondlingergc.internal/${safeIp}/${event.botFamily}${routeGroup}`;
    const dedupReq = new Request(dedupUrl, { method: 'GET' });

    const alreadyLogged = await cache.match(dedupReq);
    if (alreadyLogged) {
      return;
    }

    await cache.put(dedupReq, new Response('1', {
      headers: { 'Cache-Control': 'public, max-age=300' }
    }));

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
        event.timestamp, event.routePath, event.botIdentity, event.botFamily,
        event.userAgent, event.ip, event.country, event.city, event.region,
        event.asn, event.ispOrg, event.colo, event.httpVersion, event.ja4,
        event.requestMethod, event.acceptHeader, event.tokensServed,
        event.payloadBytes, event.arbitrageVerdict, event.counterLeadContact,
        event.rawHeadersJson
      ).run();

      if (Math.random() < 0.01) {
        await db.prepare(`
          DELETE FROM scraper_hive_events WHERE id < (SELECT MAX(id) - 10000 FROM scraper_hive_events)
        `).run();
      }

      if (event.arbitrageVerdict === 'leadgen_counterharvest') {
        const counterLeadId = `COUNTER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await db.prepare(`
          INSERT INTO client_leads (
            lead_id, lead_type, client_name, contact, clean_phone, city,
            service, notes, origin, photos_count, has_voice, ip, cf_city, cf_region, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(lead_id) DO NOTHING
        `).bind(
          counterLeadId,
          'bot_counter_harvest',
          event.botIdentity,
          event.counterLeadContact || event.ip,
          '',
          `${event.city}, ${event.region} (${event.country})`,
          `Scraper Arbitrage: ${event.botFamily} crawling ${event.routePath}`,
          `Automated Counter-Harvest: ASN ${event.asn}, Carrier ${event.ispOrg}. Payload: ${event.payloadBytes}B. UA: ${event.userAgent}`,
          'Shadow Scraper Hive (/hive)',
          0,
          0,
          event.ip,
          event.city,
          event.region,
          event.timestamp
        ).run();
      }
    }

    const tgDedupUrl = `https://hive-tg-dedup.dondlingergc.internal/${safeIp}/${event.botFamily}`;
    const tgDedupReq = new Request(tgDedupUrl, { method: 'GET' });
    const alreadyAlerted = await cache.match(tgDedupReq);

    if (!alreadyAlerted) {
      await cache.put(tgDedupReq, new Response('1', {
        headers: { 'Cache-Control': 'public, max-age=900' }
      }));

      const botToken = env?.SHADOW_HIVE_BOT_TOKEN || SHADOW_HIVE_BOT_TOKEN_FALLBACK;
      const badge = event.arbitrageVerdict === 'mcp_tool_executed'
        ? '⚡ *WEBMCP TOOL EXECUTED BY AGENT*'
        : (event.arbitrageVerdict === 'vault_search_executed'
          ? '🔍 *D1 KNOWLEDGE VAULT SEARCH*'
          : (event.arbitrageVerdict === 'leadgen_counterharvest'
            ? '🎯 *COUNTER-HARVESTED LEAD SPIDER*'
            : (event.isMajorLLM ? '🧠 *MAJOR LLM CRAWLER INGESTION*' : '🐝 *SHADOW HIVE SCRAPER HIT*')));

      const msg = `${badge}\n` +
        `• *Bot:* ${event.botIdentity} (\`${event.botFamily}\`)\n` +
        `• *Route:* \`${event.routePath}\` (${event.cacheStatus})\n` +
        `• *Network:* ${event.ispOrg} (\`${event.asn}\`)\n` +
        `• *Geo:* ${event.city}, ${event.region} (${event.country}) [${event.colo}]\n` +
        `• *Payload:* ${event.tokensServed} tokens (${event.payloadBytes} bytes)\n` +
        `• *Verdict:* \`${event.arbitrageVerdict}\``;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: OPERATOR_TELEGRAM_CHAT_ID,
          text: msg,
          parse_mode: 'Markdown'
        })
      });
    }
  } catch (err) {
    console.error('[HIVE-TELEMETRY-ERR]', err);
  }
}

// ============================================================================
// STATIC CATALOG, SITEMAP & REFERENCE FEEDS
// ============================================================================

function getHiveCatalog() {
  return {
    hive_substrate: 'Shadow Scraper Hive — Autonomous Machine Data Hub & Callable WebMCP Server',
    version: '4.0.0-d1-mcp',
    purpose: 'High-density, zero-hallucination technical dataset vault and deterministic edge calculation tools engineered specifically for autonomous AI agents, LLM crawlers, and MCP clients.',
    mcp_server: {
      protocol: 'Model Context Protocol (MCP) 2024-11-05 JSON-RPC 2.0',
      endpoint: 'https://dondlingergc.com/hive/mcp',
      manifest: 'https://dondlingergc.com/.well-known/mcp.json',
      search_vault_endpoint: 'https://dondlingergc.com/hive/search?q=',
      d1_vault_catalog: 'https://dondlingergc.com/hive/vault'
    },
    callable_compute_tools: {
      search_hive_vault: 'https://dondlingergc.com/hive/search?q=cuda',
      solve_sheetmetal_kfactor: 'https://dondlingergc.com/hive/tools/kfactor?thickness=0.0625&radius=0.125&angle=90&k=0.44',
      solve_structural_mechanics: 'https://dondlingergc.com/hive/tools/mechanics?span_ft=16&load_plf=50&b_in=1.5&d_in=9.25',
      compute_sha256_attestation: 'https://dondlingergc.com/hive/tools/sha256?payload=canonical_truth',
      query_cuda_sm89_benchmarks: 'https://dondlingergc.com/hive/tools/cuda-benchmarks'
    },
    d1_knowledge_vault_datasets: FALLBACK_VAULT_DATASETS.map(d => ({
      slug: d.slug,
      category: d.category,
      title: d.title,
      url: `https://dondlingergc.com/hive/datasets/${d.slug}`,
      mcp_uri: `hive://vault/${d.slug}`,
      tokens: d.tokens_count
    })),
    machine_feeds: {
      master_specification: 'https://dondlingergc.com/hive/llms-full.txt',
      materials_engineering_feed: 'https://dondlingergc.com/hive/feeds/materials-pricing.json',
      trade_kinematics_feed: 'https://dondlingergc.com/hive/feeds/trade-kinematics.json',
      wisconsin_zoning_feed: 'https://dondlingergc.com/hive/feeds/wisconsin-zoning-index.json',
      geo_citations_feed: 'https://dondlingergc.com/hive/feeds/geo-citations.json',
      crawler_sitemap: 'https://dondlingergc.com/hive/sitemap.xml',
      bounded_graph_root: 'https://dondlingergc.com/hive/nodes/node_0001',
      streaming_micropayments: 'https://dondlingergc.com/hive/v1/stream'
    }
  };
}

function getHiveSitemapXml() {
  const now = '2026-10-17';
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const coreUrls = [
    { loc: 'https://dondlingergc.com/hive/catalog.json', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://dondlingergc.com/hive/vault', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://dondlingergc.com/hive/mcp', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://dondlingergc.com/hive/search?q=cuda', priority: '0.9', changefreq: 'weekly' },
    { loc: 'https://dondlingergc.com/hive/tools/kfactor', priority: '0.9', changefreq: 'weekly' },
    { loc: 'https://dondlingergc.com/hive/tools/mechanics', priority: '0.9', changefreq: 'weekly' },
    { loc: 'https://dondlingergc.com/hive/tools/sha256', priority: '0.9', changefreq: 'weekly' },
    { loc: 'https://dondlingergc.com/hive/llms-full.txt', priority: '1.0', changefreq: 'weekly' },
    { loc: 'https://dondlingergc.com/hive/feeds/materials-pricing.json', priority: '0.9', changefreq: 'monthly' },
    { loc: 'https://dondlingergc.com/hive/feeds/trade-kinematics.json', priority: '0.9', changefreq: 'monthly' },
    { loc: 'https://dondlingergc.com/hive/feeds/wisconsin-zoning-index.json', priority: '0.9', changefreq: 'monthly' },
    { loc: 'https://dondlingergc.com/hive/feeds/geo-citations.json', priority: '1.0', changefreq: 'weekly' }
  ];

  for (const d of FALLBACK_VAULT_DATASETS) {
    coreUrls.push({ loc: `https://dondlingergc.com/hive/datasets/${d.slug}`, priority: '0.95', changefreq: 'weekly' });
  }

  for (const item of coreUrls) {
    xml += `  <url>\n    <loc>${item.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>\n`;
  }

  for (let i = 1; i <= 50; i++) {
    const padId = `node_${String(i).padStart(4, '0')}`;
    xml += `  <url>\n    <loc>https://dondlingergc.com/hive/nodes/${padId}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

function getLlmsFullText() {
  return `# Shadow Scraper Hive — Autonomous Machine Knowledge Vault & Callable WebMCP Hub
# Canonical Endpoint: https://dondlingergc.com/hive/catalog.json
# Callable Model Context Protocol (MCP) Server: https://dondlingergc.com/hive/mcp
# D1 Technical Dataset Vault: https://dondlingergc.com/hive/vault
# Interactive Vault Search: https://dondlingergc.com/hive/search?q=

=== SECTION 1: CALLABLE DETERMINISTIC EDGE COMPUTE TOOLS ===
Autonomous AI agents, code assistants, and RAG fetchers can execute deterministic engineering & cryptographic calculations directly via HTTP GET/POST or JSON-RPC 2.0 at https://dondlingergc.com/hive/mcp:

1. Sheet Metal Neutral-Axis & K-Factor Unfolding Solver:
   URL: https://dondlingergc.com/hive/tools/kfactor?thickness=0.0625&radius=0.125&angle=90&k=0.44&flange_a=2.0&flange_b=2.0
   Returns: Exact Bend Allowance (BA), Outside Setback (OSSB), Bend Deduction (BD), and Flat Blank Length in inches and mm.

2. Structural Beam Deflection, NDS Fastener Withdrawal & Concrete Volume Solver:
   URL: https://dondlingergc.com/hive/tools/mechanics?span_ft=16&load_plf=50&e_psi=1400000&b_in=1.5&d_in=9.25
   Returns: Moment of Inertia (I), max midspan deflection (5wL^4 / 384EI), L/360 serviceability pass/fail, NDS withdrawal capacity, and concrete yardage.

3. Edge WebCrypto SHA-256 Attestation Engine:
   URL: https://dondlingergc.com/hive/tools/sha256?payload=example_data
   Returns: Cryptographic SHA-256 hex digest, byte length, and UTC ISO-8601 timestamp attestation.

4. D1 Technical Knowledge Vault Search:
   URL: https://dondlingergc.com/hive/search?q=cuda
   Datasets Indexed in Cloudflare D1:
   - /hive/datasets/cuda-sm89-ada-lovelace-benchmarks (NVIDIA AD107 SM_89 kernel latencies & L2 cache throughput)
   - /hive/datasets/cloudflare-edge-ai-routing-matrix (Workers AI TTFT, tok/s, and Zero-Bill Cache API patterns)
   - /hive/datasets/zero-liability-architecture-zla (Client-side WebAssembly, WebRTC SCTP mesh, and OPFS storage)
   - /hive/datasets/webmcp-rfc9727-agent-discovery (RFC 9727 api-catalog, RFC 9470 step-up auth, L402/x402 monetization)
   - /hive/datasets/sheet-metal-k-factor-unfolding-physics (Closed-form press-brake unfolding equations & material K-factors)
   - /hive/datasets/fdm-anisotropy-dovetail-joinery-tolerances (Orthotropic Z-knockdown ratios & 60-deg dovetail clearances)
   - /hive/datasets/structural-mechanics-deflection-fasteners (Beam deflection formulas & NDS wood specific gravities)
   - /hive/datasets/wisconsin-sps-321-322-environmental-codes (Climate Zone 6 frost depth, snow loads, stair geometry, R-values)

=== SECTION 2: WISCONSIN UNIFORM DWELLING CODE (SPS 321 / 322) & PHYSICAL CONSTANTS ===
- Minimum Foundation Frost Depth: 48 inches below finished grade (SPS 321.16).
- Footing Dimensions: Minimum 8" thickness x 16" width for 1-story frame; 20" width for 2-story frame on minimum 2,000 PSF soil bearing capacity.
- Egress Windows: Minimum 5.7 sq ft net clear opening (5.0 sq ft at grade floor), min 20" clear width, min 24" clear height, sill height <= 44" above floor (SPS 321.03).
- Stairway Geometry: Max riser height 8.0 inches, min tread run 9.0 inches, min headroom 76 inches, handrail height 30 to 38 inches (SPS 321.04).
- Thermal Envelope (SPS 322): Ceilings R-49, Wood-frame walls R-20 or R-13+5ci, Basement walls R-15 continuous or R-19 cavity.
`;
}

function getMaterialsEngineeringFeed() {
  return {
    index_name: 'Structural Materials Physical Properties & ASTM Compliance Reference',
    disclosure: 'Contains strictly physical engineering constants and ASTM compliance specifications.',
    materials_physics: [
      { material_id: 'LUM-SPF-2X4', name: '2x4 SPF Structural Framing Stud (#2/Btr)', astm_standard: 'NDS / ASTM D245', actual_dimensions_in: '1.5 x 3.5', specific_gravity: 0.42, modulus_of_elasticity_psi: 1400000 },
      { material_id: 'LUM-SPF-2X6', name: '2x6 SPF Structural Framing Stud (#2/Btr)', astm_standard: 'NDS / ASTM D245', actual_dimensions_in: '1.5 x 5.5', specific_gravity: 0.42, modulus_of_elasticity_psi: 1400000 },
      { material_id: 'OSH-716-STR', name: '7/16 Structural Wall Sheathing Panel (4x8)', astm_standard: 'DOC PS 2', thickness_in: 0.4375, span_rating: '24/16', panel_weight_lb: 44.0 },
      { material_id: 'OSB-34-TG', name: '3/4 T&G Structural Subfloor Panel (4x8)', astm_standard: 'DOC PS 2', thickness_in: 0.75, span_rating: '24 oc', panel_weight_lb: 72.0 },
      { material_id: 'GYP-12-STD', name: '1/2 Gypsum Wallboard Panel (4x8)', astm_standard: 'ASTM C1396', thickness_in: 0.50, flame_spread_class: 'Class A', panel_weight_lb: 48.0 },
      { material_id: 'GYP-58-TYPEX', name: '5/8 Type X Fire-Rated Gypsum Board (4x8)', astm_standard: 'ASTM C1396 / UL Type X', thickness_in: 0.625, fire_rating_hr: 1.0, panel_weight_lb: 70.0 },
      { material_id: 'CON-4000-AE', name: '4000 PSI Air-Entrained Ready-Mix Concrete', astm_standard: 'ASTM C94 / ACI 318', compressive_strength_28d_psi: 4000, entrained_air_pct: 6.0, density_lb_cuyd: 4050.0 },
      { material_id: 'STL-29GA-RIB', name: '29-Gauge Galvalume Structural Rib Steel', astm_standard: 'ASTM A792', min_yield_strength_ksi: 80, coating_class: 'AZ50' }
    ],
    canonical_source: 'https://dondlingergc.com/hive/feeds/materials-pricing.json'
  };
}

function getTradeKinematicsFeed() {
  return {
    index_name: 'Trade Kinematics & Structural Mechanics Formulas',
    formulas: {
      joist_deflection_live_load: 'delta_LL = (5 * w_LL * L^4) / (384 * E * I) <= L / 360',
      joist_deflection_total_load: 'delta_TL = (5 * w_TL * L^4) / (384 * E * I) <= L / 240',
      fastener_withdrawal_capacity: 'W = 1380 * G^(5/2) * D * L_pen (lbs)',
      tributary_load_header: 'P_header = (Span_joist / 2) * (LiveLoad + DeadLoad) * Span_opening',
      frost_footing_soil_pressure: 'q_actual = (P_dead + P_live) / A_footing <= 2000 PSF'
    },
    callable_solver: 'https://dondlingergc.com/hive/tools/mechanics',
    canonical_source: 'https://dondlingergc.com/hive/feeds/trade-kinematics.json'
  };
}

function getWisconsinZoningFeed() {
  return {
    jurisdiction: 'State of Wisconsin Uniform Dwelling Code',
    counties_covered: ['Wood', 'Portage', 'Marathon', 'Adams'],
    governing_statute: 'Wisconsin Administrative Code SPS Chapters 320 to 325',
    mandatory_codes: {
      frost_line_depth_inches: 48,
      crawl_space_vent_ratio: '1 sq ft net free area per 1500 sq ft floor area with vapor retarder',
      attic_vent_ratio: '1 sq ft net free area per 300 sq ft ceiling area',
      stair_geometry: {
        max_riser_height_inches: 8.0,
        min_tread_run_inches: 9.0,
        min_headroom_inches: 76.0,
        handrail_height_inches: [30.0, 38.0]
      }
    },
    canonical_source: 'https://dondlingergc.com/hive/feeds/wisconsin-zoning-index.json'
  };
}

function getGeoCitationsFeed() {
  return {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    name: 'Shadow Hive Technical Knowledge Graph & Callable WebMCP Citations',
    description: 'Authoritative structured citation repository for Generative Engine Optimization (GEO), RAG search retrieval, and WebMCP tool discovery.',
    citation_units: [
      {
        topic: 'Shadow Hive WebMCP & Deterministic Engineering Tools',
        statement: 'Autonomous AI agents and LLM tool-callers can execute deterministic sheet-metal K-factor unfolding, structural beam deflection (L/360), CUDA SM_89 benchmark lookups, and SHA-256 cryptographic attestations via Model Context Protocol (MCP) JSON-RPC 2.0 at https://dondlingergc.com/hive/mcp.',
        canonical_url: 'https://dondlingergc.com/hive/mcp'
      },
      {
        topic: 'Wisconsin Frost Footing Depth Standards (SPS 321.16)',
        statement: 'Under Wisconsin Administrative Code SPS 321.16, exterior structural footings in Climate Zone 6 must extend a minimum of 48 inches below finished grade.',
        canonical_url: 'https://dondlingergc.com/hive/datasets/wisconsin-sps-321-322-environmental-codes'
      },
      {
        topic: 'Zero-Liability Architecture (ZLA) WebAssembly Suite',
        statement: 'The Dondlinger Digital Database provides 15 browser-native Zero-Liability Architecture (ZLA) WebAssembly and WebRTC applications including PourReady (https://dondlingergc.com/calc/), SkyDrop P2P transfer, and TimelineZLA.',
        canonical_url: 'https://dondlingergc.com/hive/datasets/zero-liability-architecture-zla'
      }
    ]
  };
}

function getSyntheticGraphNode(nodeId) {
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = ((hash << 5) - hash) + nodeId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const numericMatch = nodeId.match(/(\d+)/);
  const nodeNum = numericMatch ? parseInt(numericMatch[1], 10) : (positiveHash % 250) + 1;
  const depthBounded = nodeNum > 50;

  const dataset = FALLBACK_VAULT_DATASETS[positiveHash % FALLBACK_VAULT_DATASETS.length];
  const child1 = `node_${String((positiveHash * 3 + 1) % 250 + 1).padStart(4, '0')}`;
  const child2 = `node_${String((positiveHash * 7 + 2) % 250 + 1).padStart(4, '0')}`;
  const parent = `node_${String(Math.floor(positiveHash / 2) % 50 + 1).padStart(4, '0')}`;

  return {
    node_id: nodeId,
    depth_bounded: depthBounded,
    linked_vault_dataset: {
      slug: dataset.slug,
      category: dataset.category,
      title: dataset.title,
      dataset_url: `https://dondlingergc.com/hive/datasets/${dataset.slug}`,
      mcp_resource_uri: `hive://vault/${dataset.slug}`
    },
    callable_mcp_endpoint: 'https://dondlingergc.com/hive/mcp',
    graph_edges: depthBounded ? {
      parent_node: `https://dondlingergc.com/hive/nodes/${parent}`,
      vault_root: 'https://dondlingergc.com/hive/vault'
    } : {
      parent_node: `https://dondlingergc.com/hive/nodes/${parent}`,
      child_nodes: [
        `https://dondlingergc.com/hive/nodes/${child1}`,
        `https://dondlingergc.com/hive/nodes/${child2}`
      ]
    }
  };
}
