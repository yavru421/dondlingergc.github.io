(async () => {
    try {
        const response = await fetch('site.config.json');
        const config = await response.json();
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