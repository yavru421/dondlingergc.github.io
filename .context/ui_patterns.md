# UI Patterns & Code Architecture

## PWA Catalog (Dondlinger Digital Database)
- **Component Structure**: The catalog uses a CSS Grid (`.grid-container`) populated with `.glow-card` elements for each application.
- **Registering New Apps**: To add a new application, you must do two things:
  1. Insert the `.glow-card` HTML markup into the appropriate category within the grid.
  2. Add a new configuration entry into the `APP_DATA` JavaScript object in `index.html`. The modal overlay (`#dialog-window`) dynamically loads data from `APP_DATA` using the `openDialog(key)` function.
- **Media within Cards**: When embedding interactive media (like `<video>` tags) directly into the `.card-preview` section of a glow-card, you must add `onclick="event.stopPropagation()"` to the media element. This prevents clicks on the media controls from bubbling up and inadvertently opening the app details modal.
- **Category Ordering**: The "Guides & Support" category is the first block in the grid container, above the "Engineering PWAs" (Core Catalog) and "Client Projects".
