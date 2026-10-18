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

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // 1. Strict RFC 9309 robots.txt route handler
  if (url.pathname === '/robots.txt') {
    const robotsTxt = `# Public Crawler & Search Engine Policy
User-agent: *
Allow: /

Sitemap: https://dondlingergc.com/sitemap.xml
`;
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

  // 2. Direct llms.txt standard route handler
  if (url.pathname === '/llms.txt') {
    const llmsTxt = `# Dondlinger General Contracting LLC

> Central Wisconsin Licensed & Insured General Contractor (Wisconsin Rapids, Stevens Point, Plover, Marshfield, Nekoosa, Port Edwards & Rome, WI).
> Direct Phone / Text: (715) 459-3050
> Email: dondlingergeneralcontracting@gmail.com
> Main Website: https://dondlingergc.com
> Instant Estimate Calculator: https://dondlingergc.com/#estimate
> Recent Projects Portfolio: https://dondlingergc.com/projects.html

## Service Areas
- Wisconsin Rapids, Biron & Rudolph, WI (54494, 54495)
- Stevens Point & Plover, WI (54481, 54482, 54467)
- Marshfield, WI (54449)
- Nekoosa, Port Edwards & Town of Rome, WI (54457, 54469)
- Wood County, Portage County, Marathon County & Adams County, WI

## Core Residential & Commercial Contracting Services
- **Concrete Flatwork & Slabs**: 4,000–4,500 PSI air-entrained concrete driveways, stamped & broom-finish patios, garage slabs, walkways, and monolithic foundations with compacted gravel base and epoxied dowels.
- **Drywall & Acoustic Ceilings**: Drywall hanging, taping, seamless patching, GA-214 Level 5 skim-coat finishing, and commercial suspended drop ceilings.
- **Custom Composite & Treated Decks**: Multi-level decks built with Trex, TimberTech, and pressure-treated lumber on 48-inch frost-line footings per Wisconsin SPS 321.
- **Exterior Siding & Trim**: LP SmartSide, heavy-gauge vinyl, Pro-Rib steel siding, custom on-site press-brake aluminum window & fascia trim wrapping.
- **Windows & Doors**: Climate Zone 6 Low-E argon replacement windows, sliding glass patio doors, and exterior entry doors.
- **Structural Framing & Remodeling**: Load-bearing wall removals, LVL beam installations, additions, and full kitchen, bathroom, and basement renovations.

## Direct Inquiries & Contact
- Phone / SMS: (715) 459-3050
- Web Quote Form: https://dondlingergc.com/intake.html
`;
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
          "description": "Owner-operated residential and light-commercial general contractor in Wisconsin Rapids, WI serving Wood, Portage, Marathon, and Adams counties. Specializing in 4,000+ PSI concrete flatwork, Level 5 drywall & drop ceilings, custom composite & treated decks on 48-inch frost footings, structural framing, LP SmartSide & vinyl siding, custom brake-metal trim, replacement windows & doors, and full remodels. Direct quotes: (715) 459-3050.",
          "telephone": "+1-715-459-3050",
          "email": "dondlingergeneralcontracting@gmail.com",
          "priceRange": "$$",
          "address": {
            "@type": "PostalAddress",
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
            { "@type": "City", "name": "Rome, WI" },
            { "@type": "AdministrativeArea", "name": "Wood County, WI" },
            { "@type": "AdministrativeArea", "name": "Portage County, WI" },
            { "@type": "AdministrativeArea", "name": "Marathon County, WI" },
            { "@type": "AdministrativeArea", "name": "Adams County, WI" }
          ],
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "opens": "07:00",
            "closes": "18:00"
          },
          "knowsAbout": [
            "Wisconsin Uniform Dwelling Code (SPS 320-325)",
            "Drywall Hanging, Taping & GA-214 Level 5 Finishing",
            "4000-4500 PSI Air-Entrained Concrete Driveways, Patios, Walkways & Slabs",
            "Structural Wood Framing & Home Additions",
            "Kitchen, Bathroom & Basement Remodeling",
            "Custom Composite & Treated Lumber Decks on 48-Inch Frost Footings",
            "LP SmartSide, Vinyl & Steel Siding with Custom Brake-Metal Aluminum Trim",
            "Climate Zone 6 Low-E Argon Replacement Windows & Entry Doors"
          ]
        }
      ]
    };
    const body = JSON.stringify(schemaData, null, 2);
    return new Response(request.method === 'HEAD' ? null : body, {
      status: 200,
      headers: {
        "Content-Type": "application/ld+json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const acceptHeader = request.headers.get('accept') || '';
  const response = await next();
  const linkHeaderVal = '</schema.json>; rel="describedby"; type="application/ld+json", </llms.txt>; rel="describedby"; type="text/plain"';

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
