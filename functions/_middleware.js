function htmlToMarkdown(html, url) {
  let text = html;

  // Remove script, style, noscript, svg, header widgets, modal backdrops
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

  // Extract page title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Dondlinger Digital Database';

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
  const description = metaDescMatch ? metaDescMatch[1].trim() : '';

  // Extract headings
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');
  text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n');
  text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n');

  // Convert links
  text = text.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Convert formatting
  text = text.replace(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/gi, '**$1**');
  text = text.replace(/<(?:em|i)>(.*?)<\/(?:em|i)>/gi, '*$1*');
  text = text.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  text = text.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '\n```\n$1\n```\n');

  // Convert lists
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  text = text.replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n');

  // Convert paragraph and breaks
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gis, '\n$1\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<hr\s*[\/]?>/gi, '\n---\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&nbsp;/g, ' ')
             .replace(/&mdash;/g, '—')
             .replace(/&ndash;/g, '–');

  // Normalize whitespace and blank lines
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

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Direct robots.txt route handler with Content-Signal directive
  if (url.pathname === '/robots.txt') {
    const robotsTxt = `User-agent: *\nContent-Signal: search=yes, ai-train=no, ai-input=yes\nAllow: /\n\nSitemap: https://dondlingergc.com/sitemap.xml\n`;
    return new Response(request.method === 'HEAD' ? null : robotsTxt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
        "Content-Signal": "search=yes, ai-train=no, ai-input=yes"
      }
    });
  }

  // Direct RFC 9727 API Catalog route handler
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

    return new Response(request.method === 'HEAD' ? null : JSON.stringify(linksetData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/linkset+json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // Direct RFC 9470 OAuth Protected Resource Metadata handler
  if (url.pathname === '/.well-known/oauth-protected-resource') {
    const prmData = {
      "resource": "https://dondlingergc.com",
      "authorization_servers": [
        "https://dondlingergc.com"
      ],
      "scopes_supported": [
        "read",
        "write",
        "intake",
        "dispatch",
        "telemetry"
      ],
      "bearer_methods_supported": [
        "header"
      ],
      "resource_documentation": "https://dondlingergc.com/auth.md"
    };

    return new Response(request.method === 'HEAD' ? null : JSON.stringify(prmData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // Direct RFC 8414 OAuth Authorization Server Metadata handler with Auth.md agent_auth block
  if (url.pathname === '/.well-known/oauth-authorization-server') {
    const asData = {
      "issuer": "https://dondlingergc.com",
      "authorization_endpoint": "https://dondlingergc.com/oauth/authorize",
      "token_endpoint": "https://dondlingergc.com/oauth/token",
      "registration_endpoint": "https://dondlingergc.com/oauth/register",
      "revocation_endpoint": "https://dondlingergc.com/api/agent/revoke",
      "response_types_supported": [
        "code",
        "token"
      ],
      "grant_types_supported": [
        "authorization_code",
        "client_credentials",
        "urn:ietf:params:oauth:grant-type:token-exchange"
      ],
      "token_endpoint_auth_methods_supported": [
        "client_secret_basic",
        "client_secret_post",
        "private_key_jwt",
        "none"
      ],
      "scopes_supported": [
        "read",
        "write",
        "intake",
        "dispatch",
        "telemetry"
      ],
      "service_documentation": "https://dondlingergc.com/auth.md",
      "agent_auth": {
        "skill": "https://dondlingergc.com/auth.md",
        "register_uri": "https://dondlingergc.com/api/agent/register",
        "claim_uri": "https://dondlingergc.com/api/agent/claim",
        "revocation_uri": "https://dondlingergc.com/api/agent/revoke",
        "identity_types_supported": [
          "identity_assertion",
          "anonymous"
        ],
        "identity_assertion": {
          "assertion_types_supported": [
            "urn:ietf:params:oauth:token-type:id-jag",
            "verified_email"
          ],
          "credential_types_supported": [
            "oauth_client_credentials",
            "bearer_token",
            "api_key"
          ],
          "claim_uri": "https://dondlingergc.com/api/agent/claim",
          "revocation_uri": "https://dondlingergc.com/api/agent/revoke"
        },
        "anonymous": {
          "credential_types_supported": [
            "bearer_token",
            "api_key"
          ],
          "claim_uri": "https://dondlingergc.com/api/agent/claim"
        },
        "verified_email": {
          "credential_types_supported": [
            "bearer_token",
            "api_key"
          ],
          "claim_uri": "https://dondlingergc.com/api/agent/claim"
        },
        "events_supported": [
          "https://schemas.openid.net/secevent/oauth/event-type/token-revocation"
        ]
      }
    };

    return new Response(request.method === 'HEAD' ? null : JSON.stringify(asData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // Direct Auth.md specification route handler
  if (url.pathname === '/auth.md' || url.pathname === '/auth') {
    const authMdContent = `# Dondlinger GC auth.md

Authentication and registration discovery specification for autonomous agents interacting with Dondlinger GC services.

## Overview

Dondlinger GC supports automated agent discovery, registration, and delegated authorization per RFC 8414 (OAuth 2.0 Authorization Server Metadata), RFC 9470 (OAuth 2.0 Protected Resource Metadata), and the Auth.md standard.

- **Resource Server**: \`https://dondlingergc.com\`
- **Protected Resource Metadata**: \`https://dondlingergc.com/.well-known/oauth-protected-resource\`
- **Authorization Server Metadata**: \`https://dondlingergc.com/.well-known/oauth-authorization-server\`
- **Registration Endpoint**: \`https://dondlingergc.com/api/agent/register\`
- **Claim Endpoint**: \`https://dondlingergc.com/api/agent/claim\`
- **Revocation Endpoint**: \`https://dondlingergc.com/api/agent/revoke\`

## Agent Audience

This authentication interface is designed for autonomous AI agents, multi-agent systems, and automated dispatch workflows integrating with Dondlinger GC.

## Registration Flow

Agents can register dynamically by sending a POST request to the registration endpoint.

### 1. Identity Assertion Registration (\`identity_assertion\`)

\`\`\`http
POST /api/agent/register HTTP/1.1
Host: dondlingergc.com
Content-Type: application/json

{
  "identity_type": "identity_assertion",
  "assertion_type": "urn:ietf:params:oauth:token-type:id-jag",
  "assertion": "<signed_jwt_assertion>",
  "requested_scopes": ["read", "write", "intake", "dispatch", "telemetry"]
}
\`\`\`

Response:
\`\`\`json
{
  "token_type": "Bearer",
  "access_token": "<agent_access_token>",
  "expires_in": 86400,
  "scope": "read write intake dispatch telemetry"
}
\`\`\`

### 2. Anonymous Agent Registration (\`anonymous\`)

\`\`\`http
POST /api/agent/register HTTP/1.1
Host: dondlingergc.com
Content-Type: application/json

{
  "identity_type": "anonymous",
  "client_name": "AutonomousFieldAgent/1.0",
  "requested_scopes": ["read", "telemetry"]
}
\`\`\`

Response:
\`\`\`json
{
  "token_type": "Bearer",
  "access_token": "<anonymous_agent_token>",
  "claim_uri": "https://dondlingergc.com/api/agent/claim",
  "expires_in": 3600,
  "scope": "read telemetry"
}
\`\`\`

## Credential Use & Authentication

All API requests must include the issued credentials via HTTP Bearer token in the \`Authorization\` header:

\`\`\`http
GET /api/health HTTP/1.1
Host: dondlingergc.com
Authorization: Bearer <agent_access_token>
\`\`\`

## Scopes Supported

- \`read\`: Read public site metadata, blueprints, weather telemetry, and project status.
- \`write\`: Submit job intake requests and estimates.
- \`intake\`: Access the Dondlinger GC field intake gateway.
- \`dispatch\`: Query real-time severe weather intercept and emergency dispatch.
- \`telemetry\`: Retrieve live Edge telemetry and health metrics.
`;

    return new Response(request.method === 'HEAD' ? null : authMdContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const acceptHeader = request.headers.get('accept') || '';
  const response = await next();
  const linkHeaderVal = '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", </openapi.json>; rel="service-desc"; type="application/json", </about.html>; rel="service-doc"; type="text/html", </auth.md>; rel="describedby"; type="text/markdown"';

  // If response is HTML and markdown requested, convert to text/markdown
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    if (acceptHeader.includes('text/markdown')) {
      const html = await response.text();
      const markdown = htmlToMarkdown(html, request.url);
      const tokenEstimate = Math.ceil(markdown.length / 4);

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
