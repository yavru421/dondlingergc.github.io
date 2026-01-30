# File Manager MVP: Implementation Roadmap & Feature Prioritization

**Document Version:** 1.0
**Date:** January 30, 2026
**Status:** Ready for Development

---

## Executive Summary

This document prioritizes features for a **2-week MVP** launch of the FileManager integrated window. It focuses on core functionality with 80% user value in 20% of implementation time.

---

## MVP Scope (Week 1-2)

### Phase 1A: Core Display & Navigation (Days 1-3)

**Objective:** Get files displaying with basic interaction

**Must Implement:**
- [ ] FileManager class scaffold in `js/file-manager.js`
- [ ] Backend polling from `/api/bridge?action=pull`
- [ ] File object model with metadata
- [ ] Grid view rendering
- [ ] File categorization by MIME type (auto-sort into Images/Documents/Videos)
- [ ] Sidebar with category navigation
- [ ] Breadcrumb navigation
- [ ] Empty state UI

**Deliverable:**
```
User can:
✓ See list of transferred files in grid view
✓ Click sidebar to filter by type
✓ Navigate with breadcrumbs
✓ See empty state when no files
```

**Estimated Effort:** 12-15 hours

---

### Phase 1B: File Operations (Days 3-5)

**Objective:** Enable basic file manipulation

**Must Implement:**
- [ ] Download button (decode base64 → blob → download)
- [ ] Delete button (soft delete → trash)
- [ ] Single-file selection
- [ ] Preview panel (filename, size, date, thumbnail for images)
- [ ] Status bar with file count
- [ ] Loading states

**Deliverable:**
```
User can:
✓ Download any file to browser Downloads folder
✓ Delete file (moves to trash)
✓ Select file to view preview
✓ See file metadata (size, date, type)
✓ See image thumbnails in preview
```

**Estimated Effort:** 10-12 hours

---

### Phase 1C: Search, Sort, and UX Polish (Days 5-10)

**Objective:** Core usability features

**Must Implement:**
- [ ] Search bar (filter by filename)
- [ ] Sort options (name, date, size, type)
- [ ] List view toggle
- [ ] Multi-select (Ctrl+Click, Shift+Click ranges)
- [ ] Bulk delete
- [ ] Bulk download (as ZIP requires JSZip library)
- [ ] Right-click context menu
- [ ] Keyboard shortcuts (Delete, Ctrl+A, Ctrl+D)
- [ ] Notification toasts
- [ ] Error handling & user feedback

**Deliverable:**
```
User can:
✓ Search files by name in real-time
✓ Sort by any column
✓ Toggle between grid and list view
✓ Select multiple files (Ctrl/Cmd+Click)
✓ Bulk delete selected files
✓ Download multiple files as ZIP
✓ Right-click for context menu
✓ See helpful notifications
```

**Estimated Effort:** 15-18 hours

---

### Phase 1D: Desktop Integration (Days 10-14)

**Objective:** Integrate seamlessly into DondlingerGC window system

**Must Implement:**
- [ ] Register FileManager in `System.pages`
- [ ] Create window lifecycle (onWindowOpen, onWindowClose)
- [ ] Hookup to existing window management (minimize, maximize, close)
- [ ] Taskbar integration
- [ ] State persistence (localStorage)
- [ ] Auto-sync polling for new files
- [ ] Trash cleanup (7-day expiration)
- [ ] Responsive design (mobile fallback)

**Deliverable:**
```
✓ FileManager opens from Start menu
✓ Window can be minimized/maximized/closed
✓ Appears in taskbar
✓ State saved on refresh
✓ Auto-checks for new files every 5 seconds
✓ Works on tablet (collapsible sidebar)
```

**Estimated Effort:** 12-15 hours

---

## Feature Prioritization Matrix

### Must Have (MVP)
| Feature            | Priority   | Complexity | Value | Include? |
| ------------------ | ---------- | ---------- | ----- | -------- |
| File list display  | 🔴 Critical | Low        | 100%  | ✅        |
| File preview       | 🔴 Critical | Low        | 95%   | ✅        |
| Download           | 🔴 Critical | Low        | 98%   | ✅        |
| Delete (soft)      | 🔴 Critical | Low        | 90%   | ✅        |
| Search             | 🟡 High     | Low        | 80%   | ✅        |
| Sort               | 🟡 High     | Low        | 75%   | ✅        |
| Category sidebar   | 🟡 High     | Low        | 85%   | ✅        |
| Grid + list view   | 🟡 High     | Medium     | 70%   | ✅        |
| Multi-select       | 🟡 High     | Low        | 65%   | ✅        |
| Bulk delete        | 🟡 High     | Low        | 60%   | ✅        |
| Context menu       | 🟡 High     | Medium     | 70%   | ✅        |
| Keyboard shortcuts | 🟡 High     | Medium     | 60%   | ✅        |

### Nice to Have (Phase 2+)
| Feature              | Priority | Complexity | Value | Include? |
| -------------------- | -------- | ---------- | ----- | -------- |
| Starred/favorites    | 🟢 Medium | Low        | 50%   | ⏳        |
| Rename file          | 🟢 Medium | Low        | 40%   | ⏳        |
| PDF preview          | 🟢 Medium | Medium     | 55%   | ⏳        |
| Bulk rename          | 🟢 Medium | Medium     | 30%   | ⏳        |
| Drag & drop organize | 🟢 Medium | High       | 45%   | ⏳        |
| Tags/labels          | 🟢 Medium | High       | 35%   | ⏳        |
| Share links          | 🟢 Medium | High       | 40%   | ⏳        |
| Compression (ZIP)    | 🟢 Medium | Medium     | 45%   | ⏳        |
| Advanced filters     | 🟢 Medium | Medium     | 25%   | ⏳        |
| Cloud storage        | 🟡 High   | High       | 20%   | ⏳        |

---

## Technical Debt & Dependencies

### External Libraries (if needed)
```json
{
  "pdf.js": "For PDF preview (Phase 2)",
  "jszip": "For ZIP download (Phase 1C)",
  "prism.js": "For code syntax highlighting (Phase 2)"
}
```

**Phase 1 Can Use:** Only vanilla JavaScript, no external deps needed

---

## Acceptance Criteria for MVP

### ✅ User Stories Completed

**US-1: Browse Transferred Files**
```
As a user,
I want to see files transferred from mobile in a grid view,
So that I can quickly browse my uploaded content.

Acceptance Criteria:
✓ FileManager window opens from Start menu
✓ Files display in grid with icon + name + size + date
✓ Files are categorized by type (Images, Documents, etc.)
✓ Empty state shown when no files
✓ Grid loads in <1 second for <50 files
```

**US-2: Download Files**
```
As a user,
I want to download transferred files to my computer,
So that I can use them locally.

Acceptance Criteria:
✓ Download button visible on each file
✓ Single file downloads correctly
✓ Multiple files download as ZIP
✓ Browser default download folder used
✓ File preserves original name and format
```

**US-3: Delete Files**
```
As a user,
I want to delete files I no longer need,
So that I can keep my file manager clean.

Acceptance Criteria:
✓ Delete button shown on each file
✓ Confirmation dialog before deletion
✓ File moved to trash (soft delete)
✓ File removable from trash after 7 days
✓ Bulk delete works on selected files
```

**US-4: Find Files**
```
As a user,
I want to search and filter my transferred files,
So that I can quickly locate specific content.

Acceptance Criteria:
✓ Search box filters by filename in real-time
✓ Filter by file type (Images, Documents, etc.)
✓ Sort by name, date, size, type
✓ Results update instantly
✓ Search handles partial matches
```

**US-5: View File Details**
```
As a user,
I want to preview file information and thumbnails,
So that I can verify files before downloading.

Acceptance Criteria:
✓ Preview panel shows on file selection
✓ Displays filename, size, date, type
✓ Image thumbnails render in preview
✓ Preview updates when selection changes
✓ Preview responsive on tablet
```

---

## Testing Checklist (MVP)

### Functional Testing
- [ ] File list displays from backend
- [ ] Category filtering works
- [ ] Search functionality accurate
- [ ] Sort maintains correct order
- [ ] Download creates correct file
- [ ] Delete moves to trash
- [ ] Bulk operations complete successfully
- [ ] Multi-select works with Ctrl/Cmd+Click
- [ ] Context menu shows correct options
- [ ] Keyboard shortcuts (Del, Ctrl+A) work
- [ ] Empty state displays correctly
- [ ] Loading states show during operations

### Edge Cases
- [ ] Handles 0 files (empty state)
- [ ] Handles 1000+ files (performance)
- [ ] Handles large files (10MB+)
- [ ] Handles special characters in filenames
- [ ] Handles duplicate filenames
- [ ] Handles simultaneous downloads
- [ ] Handles offline (graceful error)
- [ ] Handles localStorage quota exceeded

### Integration Testing
- [ ] Opens from Start menu
- [ ] Closes properly
- [ ] Minimizes/maximizes correctly
- [ ] Shows in taskbar
- [ ] Window dragging works
- [ ] State persists on refresh
- [ ] Auto-sync detects new files

### Browser Compatibility
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Responsive Testing
- [ ] Desktop (1920×1080)
- [ ] Laptop (1366×768)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×667, fallback to mobile UI)

---

## Development Timeline

```
Week 1:
├─ Day 1-2: Setup + Core Display (Phase 1A)
├─ Day 3-4: File Operations (Phase 1B)
└─ Day 5: Polish UI, fix bugs

Week 2:
├─ Day 6-7: Search, Sort, Selection (Phase 1C)
├─ Day 8-9: Integration + Polish (Phase 1D)
└─ Day 10: Testing, optimization, launch prep
```

---

## Post-MVP Roadmap (Phase 2+)

### Q2 2026: Phase 2 (Enhanced Features)
- Star/favorite files
- Rename files
- PDF previews (with pdf.js)
- Text file syntax highlighting
- Advanced filtering (date range, size)
- Tags/labels system
- Move to folders (virtual)

### Q3 2026: Phase 3 (Power Features)
- Share links (with expiration)
- Password-protected downloads
- File compression on-demand
- Integration with blueprint viewer
- Integration with website builder
- Real-time sync with mobile
- Desktop notifications

### Q4 2026: Phase 4 (Enterprise)
- Cloud storage backends (OneDrive, Google Drive)
- Batch operations (move, tag, compress)
- Advanced search with full-text indexing
- File versioning
- Activity audit log
- User permissions & sharing

---

## Success Metrics

### User Adoption
- [ ] FileManager used within first 5 minutes of app opening
- [ ] 80% of transferred files downloaded/accessed within session
- [ ] Average session >2 minutes in FileManager
- [ ] No user confusion about where transferred files go

### Performance
- [ ] File list renders in <500ms (50 files)
- [ ] Download completes within 2 seconds (for files <10MB)
- [ ] Search results update in <300ms
- [ ] No memory leaks on repeated operations

### Reliability
- [ ] No crashes or console errors
- [ ] 99.9% uptime (no backend errors)
- [ ] 100% data integrity (no lost files)
- [ ] Graceful error handling for edge cases

### User Satisfaction
- [ ] Positive feedback in initial testing
- [ ] No critical bug reports post-launch
- [ ] Users cite FileManager as valuable feature
- [ ] Usage analytics show consistent engagement

---

## Risk Mitigation

### Risk: Large File Base64 Encoding
**Problem:** Files >18MB may exceed Cloudflare KV 25MB limit
**Mitigation:**
- Validate file size before accepting
- Show user warning for files >15MB
- Implement chunked upload (future)
- Document limitation clearly

### Risk: localStorage Quota Exceeded
**Problem:** Browser storage full, can't cache files
**Mitigation:**
- Gracefully handle QuotaExceededError
- Only cache metadata, not full base64
- Provide clear error message to user
- Suggest clearing browser cache

### Risk: Performance Degradation (100+ files)
**Problem:** List view lags with large file counts
**Mitigation:**
- Implement virtualization (only render visible items)
- Lazy-load thumbnails
- Pagination (50 files per page)
- Debounce search/filter

### Risk: Cross-Browser Compatibility
**Problem:** CSS/JS features not supported in older browsers
**Mitigation:**
- Test on latest 2 versions of major browsers
- Use polyfills for fetch, Promise, etc.
- Provide graceful degradation
- Mobile fallback to simpler UI

---

## Code Quality Standards (MVP)

```javascript
// ESLint Configuration
{
  "extends": "eslint:recommended",
  "env": { "browser": true, "es6": true },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "indent": ["error", 2],
    "semi": ["error", "always"]
  }
}

// JSDoc Comments Required
/**
 * Descriptive function name
 * @param {string} param1 - Description
 * @param {number} param2 - Description
 * @returns {Promise<Array>} Description
 */

// Variable Naming
// ✅ Good: const selectedFileIds, loadFiles(), state
// ❌ Avoid: const s, load(), st

// DRY Principle
// ✅ Extract repeated patterns into helper methods
// ✅ Use shared state management
// ❌ Don't duplicate event handlers

// Error Handling
try {
  // operation
} catch (error) {
  console.error('[FileManager] Context:', error);
  this.showError(error.message);
}
```

---

## Launch Checklist

- [ ] Code review completed
- [ ] All tests passing (functional + edge cases)
- [ ] Performance benchmarks met
- [ ] Documentation complete (user guide, API docs)
- [ ] Accessibility audit (WCAG AA)
- [ ] Security review (XSS, CSRF, data leaks)
- [ ] Browser compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Analytics instrumented
- [ ] User feedback channels set up
- [ ] Rollback plan documented
- [ ] Team trained on support

---

## User Documentation (for MVP)

### Quick Start Guide
```markdown
# File Manager Quick Start

1. Click 📱 Mobile on desktop to show QR code
2. Scan QR with your phone
3. Upload files from mobile
4. Files appear in File Manager window
5. Download, delete, or organize as needed

## Tips
- Use search to find files by name
- Click category on left to filter
- Right-click file for more options
- Deleted files recoverable for 7 days
```

### Known Limitations
```markdown
# Known Limitations (MVP)

- Maximum file size: 18 MB
- Files automatically deleted after 1 hour if not downloaded
- No folder creation (flat structure only)
- No real-time sync (updates every 5 seconds)
- Can't preview PDFs or videos in MVP
```

---

**End of MVP Roadmap Document**

---

## Summary: What's Included in Phase 1 MVP

### ✅ INCLUDED
1. File grid view with thumbnails
2. Categorization (Images/Documents/Videos/etc)
3. Sidebar navigation
4. Single & multi-select
5. Download (single + ZIP for multiple)
6. Delete (soft delete to trash)
7. Search by filename
8. Sort (name, date, size, type)
9. List view toggle
10. Context menu
11. File preview panel
12. Breadcrumb navigation
13. Keyboard shortcuts
14. Auto-sync polling
15. Responsive mobile fallback

### ⏳ NOT INCLUDED (Phase 2+)
1. PDF/video preview rendering
2. Star/favorite files
3. Rename files
4. Tag/label system
5. Drag-and-drop organization
6. Share links
7. File compression
8. Cloud storage integration
9. Password-protected downloads
10. Advanced filters (date range, size)

---

This MVP provides **80% of user value** while keeping implementation time to **2 weeks**.
