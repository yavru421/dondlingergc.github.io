import os

SERVICES = [
    {
        "slug": "drywall-repair",
        "trade_title": "Drywall Repair & Texture Matching",
        "service_type": "Drywall Repair and Finishing",
        "intro_title": "Seamless Drywall Repair & Texture Matching",
        "subtitle": "Invisible blowout patches, water-damaged ceiling restoration, and pneumatic knockdown & orange peel texture feathering.",
        "desc": "Surgically cut damaged drywall back to sound framing studs, install solid wood backing, and tape with high-strength fiber mesh for seamless crack-free repairs.",
        "features": [
            ("Blowout & Hole Patching", "Surgically cut damaged drywall back to structural studs, install solid wood backing, and tape with fiber mesh."),
            ("Texture Matching", "Pneumatic spray and hand feathering for orange peel, knockdown, and smooth Level 5 ceiling finishes."),
            ("Water Damage Restoration", "Full moisture inspection, mold-resistant board installation, and fast setting compound for rapid paint-ready turnover.")
        ]
    },
    {
        "slug": "concrete-work",
        "trade_title": "Concrete Flatwork, Patios & Aprons",
        "service_type": "Concrete Construction and Repair",
        "intro_title": "High-Durability Concrete Slabs, Patios & Aprons",
        "subtitle": "4,000 PSI air-entrained concrete pours, garage apron replacements, and freeze-thaw crack repairs.",
        "desc": "Engineered for harsh Central Wisconsin freeze-thaw cycles. Laser-graded sub-base compaction, heavy rebar reinforcement grid, and precision hand-tooled control joints.",
        "features": [
            ("Garage Apron Replacement", "Excavate settled or sunken asphalt, compact road base gravel, drill rebar dowels into foundation, and pour thick reinforced concrete."),
            ("Custom Patios & Walkways", "Broom finish or hand-troweled smooth perimeter borders designed for optimal water drainage away from foundations."),
            ("Slab Leveling & Repair", "Surgical saw-cutting, damaged section removal, and high-strength polymer bonding for long-lasting structural restoration.")
        ]
    },
    {
        "slug": "doors-windows",
        "trade_title": "Energy-Efficient Doors & Replacement Windows",
        "service_type": "Door and Window Installation",
        "intro_title": "Precision Window & Patio Door Installation",
        "subtitle": "Low-E argon double & triple-pane replacement windows, sliding patio doors, and custom exterior trim capping.",
        "desc": "Eliminate winter drafts and heating loss across Central Wisconsin homes. Custom aluminum trim capping, waterproof sill pan flashing, and expanding foam insulation.",
        "features": [
            ("Replacement Vinyl Windows", "High-efficiency Low-E insulated glass units custom-measured and shimmed for airtight thermal performance."),
            ("Sliding Patio Doors", "Heavy-duty dual-pane sliding glass doors with multipoint locking mechanisms and rot-proof composite sills."),
            ("Exterior Aluminum Casing", "Custom brake-bent aluminum coil wrap over exterior brickmould for zero-maintenance weatherproofing.")
        ]
    },
    {
        "slug": "subfloor-repair",
        "trade_title": "Commercial & Residential Subfloor Repair",
        "service_type": "Structural Subfloor Repair and Leveling",
        "intro_title": "Structural Subfloor Repair & Joist Sistering",
        "subtitle": "Rotten subfloor tear-out, joist sistering, commercial high-traffic floor leveling, and squeak elimination.",
        "desc": "Commercial and residential subfloor restoration. Heavy 3/4-inch T&G Sturd-I-Floor sheathing, polyurethane construction adhesive, and structural GRK screw fastening.",
        "features": [
            ("Joist Sistering & Leveling", "Reinforce sagging or rotted floor joists with engineered lumber, laser-leveled across the entire span."),
            ("Rotten Sheathing Replacement", "Plunge-cut damaged OSB/plywood, inspect framing, and install tongue-and-groove underlayment with zero deflection."),
            ("Commercial High-Traffic Subfloors", "Industrial-grade subfloor rebuilds for bars, bowling alleys, and retail facilities to handle extreme foot traffic.")
        ]
    }
]

CITIES = [
    {
        "slug": "wisconsin-rapids",
        "name": "Wisconsin Rapids",
        "county": "Wood County",
        "zip": "54494",
        "geo_note": "Specialized for Wisconsin River corridor humidity and mid-century home framing stock across Wisconsin Rapids, Port Edwards, and Nekoosa."
    },
    {
        "slug": "stevens-point",
        "name": "Stevens Point",
        "county": "Portage County",
        "zip": "54481",
        "geo_note": "Tailored for historic university-district homes, rental property renovations, and 48-inch Portage County frost depth standards."
    },
    {
        "slug": "plover",
        "name": "Plover",
        "county": "Portage County",
        "zip": "54467",
        "geo_note": "Engineered for sandy subsoil drainage, modern subdivision upgrades, and residential window & floor restorations along the Post Road corridor."
    }
]

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{trade_title} in {city_name}, WI | Dondlinger GC</title>
  <meta name="description" content="Professional {service_type_lower} in {city_name}, WI ({county}). Turnkey fixed-price hard bids, $80/hr master labor, DSPS certified. Call (715) 459-3050.">
  <link rel="canonical" href="https://dondlingergc.com/services/{page_slug}.html">
  <link rel="stylesheet" href="../style.css">
  <link rel="stylesheet" href="../css/services.css">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@graph": [
      {{
        "@type": "Service",
        "@id": "https://dondlingergc.com/services/{page_slug}.html#service",
        "name": "{trade_title} in {city_name}, WI",
        "serviceType": "{service_type}",
        "provider": {{
          "@type": "GeneralContractor",
          "name": "Dondlinger GC",
          "telephone": "+1-715-459-3050",
          "url": "https://dondlingergc.com"
        }},
        "areaServed": {{
          "@type": "City",
          "name": "{city_name}",
          "postalCode": ["{zip_code}"]
        }},
        "description": "{desc}",
        "offers": {{
          "@type": "Offer",
          "priceSpecification": {{
            "@type": "PriceSpecification",
            "priceCurrency": "USD",
            "description": "Turnkey fixed-price hard bid proposals."
          }}
        }}
      }},
      {{
        "@type": "BreadcrumbList",
        "itemListElement": [
          {{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dondlingergc.com/" }},
          {{ "@type": "ListItem", "position": 2, "name": "Services", "item": "https://dondlingergc.com/services/" }},
          {{ "@type": "ListItem", "position": 3, "name": "{trade_title} {city_name}", "item": "https://dondlingergc.com/services/{page_slug}.html" }}
        ]
      }}
    ]
  }}
  </script>
</head>
<body>
  <header class="header">
    <div class="header-container">
      <a href="../index.html" class="brand-logo">DONDLINGER<span>GC</span></a>
      <a href="tel:+17154593050" class="cta-pill">Call (715) 459-3050</a>
    </div>
  </header>

  <main class="service-detail">
    <div class="service-hero">
      <span class="badge">Wisconsin DSPS Certified • {county}</span>
      <h1>{intro_title} in {city_name}, WI</h1>
      <p class="subtitle">{subtitle}</p>
      
      <div class="hero-actions">
        <a href="tel:+17154593050" class="btn btn-primary">Direct Call: (715) 459-3050</a>
        <a href="sms:+17154593050?body=Hi%20John,%20I%20have%20a%20{svc_sms}%20project%20in%20{city_name}." class="btn btn-secondary">Text Photos for Quick Quote</a>
      </div>
    </div>

    <section class="service-content">
      <h2>Local Craftsmanship & Engineering</h2>
      <p>{desc}</p>
      <p>{geo_note}</p>

      <div class="features-grid">
        <div class="feature-card">
          <h3>{feat1_title}</h3>
          <p>{feat1_desc}</p>
        </div>
        <div class="feature-card">
          <h3>{feat2_title}</h3>
          <p>{feat2_desc}</p>
        </div>
        <div class="feature-card">
          <h3>{feat3_title}</h3>
          <p>{feat3_desc}</p>
        </div>
      </div>

      <div class="cta-box">
        <h3>Ready to Schedule Your Project in {city_name}?</h3>
        <p>Text photos of your project to <strong>(715) 459-3050</strong> for a prompt, turnkey fixed-price hard bid.</p>
        <a href="tel:+17154593050" class="btn btn-primary">Call John Dondlinger</a>
      </div>
    </section>
  </main>

  <div id="dgc-mobile-action-rail">
    <a href="tel:+17154593050" class="action-btn call-btn">Call (715) 459-3050</a>
    <a href="sms:+17154593050?body=Hi%20John,%20looking%20for%20a%20quote%20on%20{svc_sms}%20in%20{city_name}." class="action-btn sms-btn">Text Photos</a>
  </div>
</body>
</html>
"""

out_dir = r"C:\dev\dondlingergc.github.io\services"
os.makedirs(out_dir, exist_ok=True)

count = 0
for svc in SERVICES:
    for city in CITIES:
        page_slug = f"{svc['slug']}-{city['slug']}"
        content = TEMPLATE.format(
            trade_title=svc["trade_title"],
            service_type=svc["service_type"],
            service_type_lower=svc["service_type"].lower(),
            page_slug=page_slug,
            city_name=city["name"],
            county=city["county"],
            zip_code=city["zip"],
            geo_note=city["geo_note"],
            intro_title=svc["intro_title"],
            subtitle=svc["subtitle"],
            desc=svc["desc"],
            svc_sms=svc["slug"].replace("-", " "),
            feat1_title=svc["features"][0][0],
            feat1_desc=svc["features"][0][1],
            feat2_title=svc["features"][1][0],
            feat2_desc=svc["features"][1][1],
            feat3_title=svc["features"][2][0],
            feat3_desc=svc["features"][2][1]
        )
        file_path = os.path.join(out_dir, f"{page_slug}.html")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        count += 1

print(f"Successfully generated {count} service landing pages in {out_dir}")
