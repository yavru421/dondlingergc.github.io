# MOBILE-AUDIT-SUBAGENT.md

## Sub-Agent Mobile Usability Audit & Action Plan

---

### 1. Audit Findings: Mobile Usability & Breakage

#### 1.1. HTML Structure & Meta Tags
- **Viewport Meta Tag**: Check if `<meta name="viewport" content="width=device-width, initial-scale=1">` is present in index.html. Absence or misconfiguration will cause layout issues on mobile.
- **DOCTYPE**: Confirmed present (`<!DOCTYPE html>`), so no issue here.
- **Semantic Structure**: Ensure use of semantic tags (`header`, `nav`, `main`, `footer`) for accessibility and responsive frameworks.

#### 1.2. CSS Issues
- **Responsive CSS**: Check for media queries targeting mobile breakpoints (e.g., `@media (max-width: 600px)`). If missing, the site will not adapt to small screens.
- **Fixed Widths**: Look for hardcoded widths (e.g., `width: 1200px;`) or large paddings/margins that prevent content from fitting on mobile.
- **Overflow & Hidden Content**: Check for `overflow: hidden` or elements positioned off-screen on mobile.
- **Font Sizes**: Ensure font sizes are not too small for mobile (should use `rem`, `em`, or responsive units).
- **Touch Targets**: Buttons/links must be large enough for touch (minimum 48x48px recommended).

#### 1.3. JavaScript Issues
- **Mobile Detection/Redirection**: Check for scripts that hide or redirect content on mobile (e.g., `if (isMobile) { ... }`).
- **Event Handling**: Ensure click/tap events are not desktop-only (e.g., `onmouseover` instead of `onclick`).
- **Blocking Scripts**: Look for JS errors that may prevent rendering on mobile browsers (use browser dev tools for runtime errors).

#### 1.4. DOM & Content
- **Images & Media**: Ensure images are responsive (use `max-width: 100%` and `height: auto`).
- **Navigation**: Menus should be accessible and usable on touch devices (consider hamburger menus for small screens).
- **Popups/Modals**: Ensure modals are mobile-friendly and not off-screen or uncloseable.

#### 1.5. Deployment & Asset Loading
- **Asset Paths**: Ensure all CSS/JS/image paths are correct and load on mobile (no 404s).
- **Third-Party Libraries**: Check if any desktop-only libraries are used that break on mobile.

---

### 2. Actionable Fixes Needed

1. **Add/Correct Viewport Meta Tag** in index.html (top of `<head>`).
2. **Audit and Refactor CSS**:
   - Add responsive media queries for common breakpoints.
   - Replace fixed widths with relative units (`%`, `vw`, `em`).
   - Ensure all images and containers are fluid.
   - Increase font sizes and touch target sizes for mobile.
   - Remove or adjust any `overflow: hidden` that causes clipping.
3. **Review and Update Navigation**:
   - Implement a mobile-friendly menu (hamburger or collapsible).
   - Ensure all navigation is accessible via touch.
4. **Check and Fix JavaScript**:
   - Remove any scripts that hide content on mobile.
   - Ensure all interactive elements work with touch events.
   - Fix any JS errors that may block rendering.
5. **Test All Asset Loading**:
   - Verify all CSS, JS, and images load correctly on mobile.
   - Fix any broken links or 404s.
6. **Accessibility Improvements**:
   - Add ARIA labels and roles where needed.
   - Ensure sufficient color contrast for readability.
7. **Test on Real Devices**:
   - Use browser dev tools and real devices to verify fixes.

---

### 3. Step-by-Step Plan (with Checkpoints)

#### Step 1: Viewport & Meta Tags
- [ ] Open index.html (lines 1–20, `<head>` section).
- [ ] Add or correct the viewport meta tag.
- **Checkpoint: User review of `<head>` section.**

#### Step 2: CSS Audit & Refactor
- [ ] Identify all CSS files used (inline and external).
- [ ] Search for fixed widths, large paddings/margins, and lack of media queries.
- [ ] Add/adjust media queries for mobile breakpoints.
- [ ] Make images and containers responsive.
- [ ] Increase font and button sizes for mobile.
- **Checkpoint: User review of main CSS changes.**

#### Step 3: Navigation & Menus
- [ ] Review navigation markup (likely in index.html and/or included partials).
- [ ] Implement a mobile-friendly menu if not present.
- **Checkpoint: User review of navigation on mobile.**

#### Step 4: JavaScript Review
- [ ] Audit all JS for mobile-blocking logic or errors.
- [ ] Ensure all interactive elements work with touch.
- **Checkpoint: User review of interactive elements on mobile.**

#### Step 5: Asset Loading & Deployment
- [ ] Test site on mobile (dev tools + real device).
- [ ] Check for missing/broken assets.
- [ ] Fix any path or loading issues.
- **Checkpoint: User review of site loading and appearance.**

#### Step 6: Accessibility & Final Testing
- [ ] Add ARIA labels/roles as needed.
- [ ] Check color contrast and readability.
- [ ] Final test on multiple devices and browsers.
- **Checkpoint: Final user review and sign-off.**

---

### 4. Priorities

1. **Critical**: Viewport meta tag, CSS media queries, navigation usability, JS errors.
2. **High**: Responsive images, touch targets, asset loading.
3. **Medium**: Accessibility, color contrast, ARIA.
4. **Ongoing**: Testing on real devices and browsers.

---

### 5. Summary Table

| Area          | File(s)         | Line(s)     | Action Needed                 | Priority |
| ------------- | --------------- | ----------- | ----------------------------- | -------- |
| Viewport      | index.html      | 1–20        | Add/correct meta tag          | Critical |
| CSS           | All CSS files   | All         | Add media queries, fix widths | Critical |
| Navigation    | index.html      | nav section | Make mobile-friendly          | Critical |
| JavaScript    | All JS files    | All         | Remove mobile-blocking logic  | Critical |
| Images        | index.html, CSS | All         | Make responsive               | High     |
| Assets        | All             | All         | Fix broken/missing assets     | High     |
| Accessibility | All             | All         | Add ARIA, improve contrast    | Medium   |

---

**Next Steps:**
Follow the plan above, making changes in the order of priority, and pause at each checkpoint for user review. This will ensure a robust, mobile-friendly, and accessible site without breaking the desktop experience.
