(async () => {
    try {
        // Embedded config instead of fetching
        const config = {
    "_meta": {
        "contract": "Do not rename keys. Client edits VALUES only.",
        "version": "1.0"
    },
    "site": {
        "title": "Dondlinger General Contracting — Design-Build",
        "description": "Design-build construction and architectural drawings prepared for real projects — not just concepts.",
        "domain": "dondlingergc.com"
    },
    "business": {
        "name": "Dondlinger General Contracting",
        "nameShort": "DondlingerGC",
        "nameWeb": "DondlingerGC-Web",
        "tagline": "Design-Build",
        "description": "Design-build construction and architectural drawings prepared for real projects — not just concepts.",
        "foundedYear": 2020,
        "projectsCount": "150+",
        "clientSatisfaction": "98%"
    },
    "branding": {
        "primaryColor": "#0ea5e9",
        "secondaryColor": "#059669",
        "accentColor": "#f0a23b",
        "bgDark": "#0b0d11"
    },
    "contact": {
        "phone": "(715) 221-2825",
        "email": "dondlingergeneralcontracting@gmail.com",
        "emailDisplay": "hello@dondlingergc-web.dev",
        "responseTime": "2 hours",
        "businessHours": "Mon-Fri, 9AM-5PM CST"
    },
    "location": {
        "address": "Wisconsin Rapids, WI",
        "region": "Central Wisconsin",
        "serviceArea": "Wisconsin"
    },
    "vertical": {
        "preset": "contractor",
        "description": "Construction and design-build services"
    },
    "features": {
        "wizard": true,
        "portfolio": true,
        "documents": true,
        "contactForm": true
    },
    "pages": {
        "index": "Dondlinger General Contracting — Design-Build",
        "about": "About – DondlingerGC-Web",
        "contact": "Contact – DondlingerGC-Web",
        "portfolio": "Portfolio – DondlingerGC-Web",
        "services": "Services – DondlingerGC-Web",
        "wizard": "Project Wizard – DondlingerGC-Web",
        "mobile": "Dondlinger General Contracting"
    },
    "projects": [
        {
            "title": "Residential Framing",
            "location": "Wisconsin Rapids"
        },
        {
            "title": "Remodel & Finish Work",
            "location": "Central Wisconsin"
        },
        {
            "title": "Structural Repair",
            "location": "Wood County"
        }
    ],
    "portfolio": [
        {
            "title": "Nexus Analytics"
        },
        {
            "title": "Bloom Boutique"
        },
        {
            "title": "Aether Brand"
        }
    ],
    "testimonials": [
        {
            "quote": "DondlingerGC-Web completely transformed our online presence. The team explained everything clearly, and they delivered ahead of schedule. Highly recommend!",
            "name": "Sarah M.",
            "title": "Owner, Local Retail Business"
        },
        {
            "quote": "I was skeptical about web development, but they made it simple. No upsells, no confusion. Just a professional website that gets results.",
            "name": "Mike T.",
            "title": "Service Company Owner"
        },
        {
            "quote": "They helped us launch an e-commerce shop. The support after launch has been exceptional. It's clear they care about our success.",
            "name": "Jennifer P.",
            "title": "Online Store Manager"
        }
    ],
    "images": {
        "hero": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80",
        "construction": [
            "https://images.unsplash.com/photo-1596079890681-7c1c7d2f9a8b?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
        ]
    }
};
        window.config = config;

        // Set CSS variables for pages with inline styles (index.html, mobile.html)
        const root = document.documentElement;
        root.style.setProperty('--accent', config.branding.accentColor);
        root.style.setProperty('--bg', config.branding.bgDark);

        // Replace all data-config attributes
        document.querySelectorAll('[data-config]').forEach(el => {
            const path = el.dataset.config;
            let value = config;
            const keys = path.split('.');

            for (let key of keys) {
                if (key.includes('[')) {
                    const match = key.match(/(.+)\[(\d+)\]/);
                    if (match) {
                        const k = match[1];
                        const index = parseInt(match[2]);
                        value = value[k][index];
                    }
                } else {
                    value = value[key];
                }
            }

            if (typeof value === 'object' && value !== null) {
                // For nested objects like testimonials, handle specially
                if (el.dataset.config.includes('testimonials')) {
                    const testimonialIndex = parseInt(path.match(/testimonials\[(\d+)\]/)[1]);
                    const testimonial = config.testimonials[testimonialIndex];
                    if (el.classList.contains('quote')) el.textContent = testimonial.quote;
                    if (el.classList.contains('name')) el.textContent = testimonial.name;
                    if (el.classList.contains('title')) el.textContent = testimonial.title;
                }
                return;
            }

            if (el.tagName === 'IMG' || el.tagName === 'SOURCE') {
                el.src = value;
            } else if (el.tagName === 'TITLE') {
                document.title = value;
            } else if (el.tagName === 'META' && el.name === 'description') {
                el.content = value;
            } else if (el.tagName === 'A' && el.href.startsWith('mailto:')) {
                el.href = `mailto:${value}`;
            } else {
                el.textContent = value;
            }
        });
    } catch (error) {
        console.error('Error loading config:', error);
    }
})();