(() => {
    if (!window.SITE_CONFIG) {
        return;
    }

    const cfg = window.SITE_CONFIG;
    const footer = document.getElementById("site-footer");
    if (footer) {
        footer.textContent = `© ${new Date().getFullYear()} ${cfg.businessName} • ${cfg.location}`;
    }

    const nav = document.querySelector(".nav-header");
    if (nav && !nav.querySelector(".brand")) {
        const brand = document.createElement("div");
        brand.className = "brand";

        const homeLink = document.createElement("a");
        homeLink.href = "index.html";
        homeLink.className = "brand-name";
        homeLink.textContent = cfg.businessName;

        const phoneLink = document.createElement("a");
        phoneLink.href = `tel:${cfg.phone}`;
        phoneLink.className = "brand-phone";
        phoneLink.textContent = cfg.phone;

        brand.append(homeLink, phoneLink);
        nav.insertBefore(brand, nav.firstChild);
    }

    const heroTitle = document.getElementById("hero-title");
    if (heroTitle) {
        heroTitle.textContent = cfg.businessName;
    }

    const heroSub = document.getElementById("hero-subline");
    if (heroSub && cfg.tagline) {
        heroSub.textContent = cfg.tagline;
    }
})();
