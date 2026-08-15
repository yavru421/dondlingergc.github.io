export async function onRequestGet() {
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
            "href": "https://dondlingergc.com/about.html",
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

  return new Response(JSON.stringify(linksetData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/linkset+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
