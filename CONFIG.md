# 🔧 Site Configuration Reference

> **DO NOT DELETE** - This file contains all site-specific values.
> When converting to template, replace these values with `{{VARIABLE_NAME}}` placeholders.

---

## 📇 Business Information

| Variable                  | Current Value                                                                                        | Used In                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- |
| `{{BUSINESS_NAME}}`       | Dondlinger General Contracting                                                                       | index.html, all pages           |
| `{{BUSINESS_NAME_SHORT}}` | DondlingerGC                                                                                         | navbar, titles                  |
| `{{BUSINESS_NAME_WEB}}`   | DondlingerGC-Web                                                                                     | about.html, services.html, etc. |
| `{{TAGLINE}}`             | Design-Build                                                                                         | index.html                      |
| `{{DESCRIPTION}}`         | Design-build construction and architectural drawings prepared for real projects — not just concepts. | index.html                      |

---

## 📍 Contact Information

| Variable              | Current Value                          | Used In                       |
| --------------------- | -------------------------------------- | ----------------------------- |
| `{{PHONE}}`           | (715) 221-2825                         | index.html                    |
| `{{PHONE_FORMATTED}}` | +1 (555) 123-4567                      | contact.html                  |
| `{{EMAIL}}`           | dondlingergeneralcontracting@gmail.com | index.html (2x), contact form |
| `{{EMAIL_DISPLAY}}`   | hello@dondlingergc-web.dev             | contact.html                  |
| `{{LOCATION}}`        | Wisconsin Rapids, WI                   | index.html                    |
| `{{LOCATION_REGION}}` | Central Wisconsin                      | index.html                    |
| `{{SERVICE_AREA}}`    | Wisconsin                              | about.html, services.html     |

---

## 🌐 Domain & Hosting

| Variable                    | Current Value         | Used In       |
| --------------------------- | --------------------- | ------------- |
| `{{DOMAIN}}`                | dondlingergc.com      | CNAME         |
| `{{WRANGLER_PROJECT_NAME}}` | dondlingergc          | wrangler.toml |
| `{{D1_DATABASE_NAME}}`      | dondlingergc_db       | wrangler.toml |
| `{{D1_DATABASE_ID}}`        | your-database-id-here | wrangler.toml |

---

## 🎨 Branding

| Variable              | Current Value        | Notes                  |
| --------------------- | -------------------- | ---------------------- |
| `{{PRIMARY_COLOR}}`   | #0ea5e9 (sky blue)   | Tailwind primary-500   |
| `{{SECONDARY_COLOR}}` | #059669 (emerald)    | Tailwind secondary-500 |
| `{{ACCENT_COLOR}}`    | #f0a23b (amber/gold) | index.html custom      |
| `{{BG_DARK}}`         | #0b0d11              | index.html             |

---

## 📄 Page Titles

| Page           | Current Title                                 |
| -------------- | --------------------------------------------- |
| index.html     | Dondlinger General Contracting — Design-Build |
| about.html     | About – DondlingerGC-Web                      |
| contact.html   | Contact – DondlingerGC-Web                    |
| portfolio.html | Portfolio – DondlingerGC-Web                  |
| services.html  | Services – DondlingerGC-Web                   |
| wizard.html    | Project Wizard – DondlingerGC-Web             |

---

## 📊 Stats & Claims

| Variable                  | Current Value        | Used In      |
| ------------------------- | -------------------- | ------------ |
| `{{PROJECTS_COUNT}}`      | 150+                 | about.html   |
| `{{CLIENT_SATISFACTION}}` | 98%                  | about.html   |
| `{{FOUNDED_YEAR}}`        | 2020                 | about.html   |
| `{{RESPONSE_TIME}}`       | 2 hours              | contact.html |
| `{{BUSINESS_HOURS}}`      | Mon-Fri, 9AM-5PM CST | contact.html |

---

## 🏗️ Construction Projects (index.html)

| Variable                 | Current Value         | Notes                           |
| ------------------------ | --------------------- | ------------------------------- |
| `{{PROJECT_1_TITLE}}`    | Residential Framing   | index.html construction gallery |
| `{{PROJECT_1_LOCATION}}` | Wisconsin Rapids      | index.html construction gallery |
| `{{PROJECT_2_TITLE}}`    | Remodel & Finish Work | index.html construction gallery |
| `{{PROJECT_2_LOCATION}}` | Central Wisconsin     | index.html construction gallery |
| `{{PROJECT_3_TITLE}}`    | Structural Repair     | index.html construction gallery |
| `{{PROJECT_3_LOCATION}}` | Wood County           | index.html construction gallery |

---

## 🖼️ Portfolio Items (portfolio.html)

| Variable                | Current Value   | Notes                    |
| ----------------------- | --------------- | ------------------------ |
| `{{PORTFOLIO_1_TITLE}}` | Nexus+Analytics | URL-safe for placeholder |
| `{{PORTFOLIO_2_TITLE}}` | Bloom+Boutique  | URL-safe for placeholder |
| `{{PORTFOLIO_3_TITLE}}` | Aether+Brand    | URL-safe for placeholder |
| `{{PORTFOLIO_4_TITLE}}` | FitTrack+Pro    | URL-safe for placeholder |
| `{{PORTFOLIO_5_TITLE}}` | EduFlow+LMS     | URL-safe for placeholder |
| `{{PORTFOLIO_6_TITLE}}` | FreshBites      | URL-safe for placeholder |

---

## 🖼️ Images & Assets

### Hero/Background Images (Unsplash URLs)
```
index.html background:
https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80

Construction gallery:
https://images.unsplash.com/photo-1596079890681-7c1c7d2f9a8b?auto=format&fit=crop&w=800&q=80
https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80
https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80
```

### Portfolio Images (FIXED ✅)
Now using placehold.co with dynamic text from variables:
```
https://placehold.co/640x360/0ea5e9/ffffff?text={{PORTFOLIO_X_TITLE}}
```

### Blueprints (Project-Specific)
```
blueprints/fawley.png
blueprints/fawley(1).png
blueprints/fawley(2).png
blueprints/fawley(3).png
blueprints/AndersonWeber02.26.pdf
blueprints/maherdeck.pdf
```

---

## 👥 Testimonials (about.html)

### Testimonial 1
- **Quote:** "DondlingerGC-Web completely transformed our online presence. The team explained everything clearly, and they delivered ahead of schedule. Highly recommend!"
- **Name:** Sarah M.
- **Title:** Owner, Local Retail Business

### Testimonial 2
- **Quote:** "I was skeptical about web development, but they made it simple. No upsells, no confusion. Just a professional website that gets results."
- **Name:** Mike T.
- **Title:** Service Company Owner

### Testimonial 3
- **Quote:** "They helped us launch an e-commerce shop. The support after launch has been exceptional. It's clear they care about our success."
- **Name:** Jennifer P.
- **Title:** Online Store Manager

---

## 🚨 Missing Files (Need to Create)

These files are referenced but don't exist:

| File                   | Status    |
| ---------------------- | --------- |
| `components/navbar.js` | ❌ MISSING |
| `components/footer.js` | ❌ MISSING |
| `style.css`            | ❌ MISSING |
| `script.js`            | ❌ MISSING |
| `/static/favicon.ico`  | ❌ MISSING |

---

## 🗑️ Files to Remove for Template

| File                             | Reason                 |
| -------------------------------- | ---------------------- |
| `FUCKINGUNBELIEVEABLE.txt`       | Inappropriate filename |
| `fuckingevenmoreunbelieable.txt` | Inappropriate filename |
| `MOBILE-AUDIT-SUBAGENT.md`       | Dev artifact           |
| `blueprints/*`                   | Project-specific data  |
| `blueprints-manifest.json`       | Project-specific data  |

---

## ✅ Template Conversion Checklist

- [ ] Create missing component files (navbar.js, footer.js, style.css, script.js)
- [ ] Add favicon to /static/
- [x] Fix broken portfolio image URLs ✅ DONE (now using placehold.co)
- [x] Mobile support added ✅ DONE
- [ ] Update wrangler.toml with new database ID
- [ ] Update CNAME with new domain
- [ ] Remove project-specific files
- [ ] Update README.md with setup instructions
- [ ] Test all pages load correctly
- [ ] Test contact form submission

---

## 📌 Current Status: LIVE SITE READY

All files currently have **actual values** (not placeholders) so dondlingergc.com works correctly.

This CONFIG.md serves as a **reference document** for when you want to create a template version.
At that point, you would copy the repo and do find/replace using this reference.

---

*Generated: January 25, 2026*
*Last Updated: January 25, 2026 - Site restored with actual values, mobile support added*
