# File Manager UI Design Specification
## DondlingerGC Desktop Integration

**Document Version:** 1.0
**Date:** January 30, 2026
**Status:** Design Specification (Ready for Implementation)

---

## Executive Summary

This document outlines the design and architecture for a desktop file manager window integrated into the DondlingerGC virtual desktop system. The file manager enables users to view, organize, preview, and manage files transferred from mobile devices via the QR code-based file transfer system.

The design synthesizes patterns from **Dolphin File Manager** (KDE), **macOS Finder**, and **Windows File Explorer** while adapting to browser-based constraints and the existing DondlingerGC desktop architecture.

---

## Research Findings

### Dolphin File Manager (KDE Linux)
**Key Features:**
- **Navigation Modes:** Breadcrumb navigation bar, folder sidebar, traditional tree view
- **View Modes:** Icon grid view, detailed list view, compact view
- **Split Windows:** Dual pane browsing of two directories simultaneously
- **Tabbed Browsing:** Multiple folders open in single window
- **Preview Panel:** Optional right-side information panel showing file metadata
- **Tagging & Search:** File tagging with Baloo indexing service
- **Right-Click Context Menu:** Quick actions (compress, share, duplicate, custom actions)
- **Extensibility:** Plugin system for additional functionality (git integration, cloud services)

**UI Philosophy:** Lightweight, focus on usability, highly customizable

---

### macOS Finder
**Key Features:**
- **Sidebar Navigation:** Quick access to favorites (iCloud, Recents, Desktop, Downloads)
- **Clean Layout:** Minimal chrome with focus on content
- **Preview Panel:** Quick Look integration on right side showing file preview
- **Drag & Drop:** Intuitive file organization and app launching
- **Smart Folders:** Saved searches that auto-update
- **Column View Option:** Hierarchical browsing with preview
- **Metadata Display:** File info pane showing size, created date, modified date

**UI Philosophy:** Clean, minimal, intuitive interactions

---

### Windows File Explorer
**Key Features:**
- **Ribbon Toolbar:** Context-sensitive action buttons
- **Sidebar Navigation:** Quick access folders (This PC, Favorites, OneDrive)
- **Detail Pane:** Adjustable column widths for custom file info display
- **Thumbnail Previews:** Large thumbnail view option
- **Breadcrumb Navigation:** Click-through path navigation
- **Quick Preview:** Inline previews for selected files
- **Address Bar:** Type path directly for navigation

**UI Philosophy:** Feature-rich, powerful organization, discoverable actions

---

### Web-Based File Managers
**Patterns from Filestack, FilePizza, etc.:**
- Drag-and-drop upload zones
- Progress indicators for transfers
- File type icons and colors
- Responsive grid/list layouts
- Modal dialogs for confirmations
- Client-side file handling (no actual filesystem access)
- localStorage for persistence

---

## Design Specification

### 1. Layout Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ 📥 File Transfer Window Header                   [−] [▢] [×]   │
├─────┬───────────────────────────────────────────────────────────┤
│     │                                                            │
│  S  │  Breadcrumb: Home > Received Files > [Search]             │
│  I  │                                                            │
│  D  │  ┌─────────────────────────────────────────────────────┐ │
│  E  │  │                                                     │ │
│  B  │  │     FILES LIST / GRID VIEW                          │ │
│  A  │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐        │ │
│  R  │  │  │   📄 PDF  │ │   📸 JPG  │ │   📝 TXT  │        │ │
│     │  │  │ file.pdf  │ │ photo.jpg │ │ notes.txt │        │ │
│  •  │  │  │ 2.4 MB    │ │ 4.2 MB    │ │ 12 KB     │        │ │
│  R  │  │  │ Jan 28    │ │ Jan 29    │ │ Jan 30    │        │ │
│  E  │  │  └───────────┘ └───────────┘ └───────────┘        │ │
│  C  │  │                                                     │ │
│  E  │  │  Or [List View] with columns:                       │ │
│  I  │  │  Name | Size | Type | Date | Actions               │ │
│  V  │  │                                                     │ │
│  E  │  └─────────────────────────────────────────────────────┘ │
│  D  │                                                            │
│     │  ┌─────────────────────────────────────────────────────┐ │
│  F  │  │ PREVIEW PANEL                                       │ │
│  I  │  │ Filename: photo.jpg                                 │ │
│  L  │  │ Type: JPEG Image                                    │ │
│  E  │  │ Size: 4.2 MB                                        │ │
│  S  │  │ Date: Jan 29, 2026 3:45 PM                         │ │
│     │  │ ┌─────────────┐                                    │ │
│  •  │  │ │             │                                    │ │
│  A  │  │ │  [Thumbnail │ Download | Delete | Info          │ │
│  L  │  │ │   Preview]  │                                    │ │
│  L  │  │ │             │                                    │ │
│     │  │ └─────────────┘                                    │ │
│  F  │  └─────────────────────────────────────────────────────┘ │
│  I  │                                                            │
│  L  │  [↓ Download All] [🗑 Delete Selected] [📋 Copy Link]   │
│  E  │                                                            │
│  S  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Sidebar Navigation

**Sections:**
- **📥 Received Files** - Root directory of all transferred files
- **📸 Images** - Auto-categorized: PNG, JPG, GIF, WebP, SVG
- **📄 Documents** - PDF, TXT, MD, DOCX, etc.
- **📦 Archives** - ZIP, RAR, 7z, TAR, GZIP
- **🎵 Media** - MP3, MP4, WAV, OGG, etc.
- **⭐ Starred** - User-tagged favorite files
- **🗑️ Trash** - Recently deleted files (kept 7 days)
- **All Files** - Flat view of all items

**Plus Buttons:**
- `+ New Folder` - Create directory
- `+ Favorite This` - Star current location

---

### 3. Main Content Area

#### **View Mode Toggle**
- Grid View (default, icon + name + size)
- List View (detailed columns)
- Compact View (minimal space)

#### **File Display (Grid View)**
```
┌─────────────┐
│   📄 PDF    │
│ document    │
│ 2.4 MB      │
│ Jan 28      │
└─────────────┘
  [Hover: Show actions]
```

#### **File Display (List View)**
```
📄  document.pdf          2.4 MB  PDF    Jan 28, 3:45 PM  [⋯ Actions]
📸  photo.jpg             4.2 MB  Image  Jan 29, 2:30 PM  [⋯ Actions]
📝  notes.txt             12 KB   Text   Jan 30, 10:15 AM [⋯ Actions]
```

#### **Sorting & Filtering**
- Sort by: Name, Size, Type, Date Modified, Date Added
- Filter: File type, Date range, Size range
- Search: Full-text search across filenames

---

### 4. Preview Panel (Right Side)

**For Images:**
- Thumbnail preview (max 250px width)
- Image dimensions
- File size
- Date created/modified
- EXIF metadata (if available)

**For PDFs:**
- First page preview (rendered thumbnail)
- Page count
- File size
- Creation date

**For Text Files:**
- First 500 chars preview (with scroll)
- Encoding info
- Line count
- File size

**For Videos/Audio:**
- Play button with duration
- Audio waveform preview (if available)
- Bitrate info

**Generic:**
- File type icon
- Full path
- File size
- Creation date
- Last modified date
- Permissions (View Only / Editable in future)

---

### 5. Actions & Context Menu

#### **Primary Actions (Always Visible)**
- ⬇️ **Download** - Save file to browser default folder
- 🗑️ **Delete** - Move to trash (soft delete, 7-day retention)
- 📋 **Copy Link** - Copy shareable link (future: for cloud integration)
- ℹ️ **Info** - Show detailed metadata

#### **Secondary Actions (Right-Click Menu)**
- Open in new window (for supported types)
- Rename file
- Duplicate file
- Move to folder
- Add to starred
- Share (future integration)
- Archive (compress)

#### **Batch Operations**
- Select multiple files (Ctrl/Cmd + Click, Shift + Click ranges)
- Bulk delete
- Bulk download
- Bulk move

---

### 6. Breadcrumb Navigation

```
🏠 > Received Files > Images > [2026-01]
  ↑      ↑              ↑         ↑
 Home  Category      Folder    Current
 (click to jump to any level)
```

---

### 7. Search & Filter Bar

```
[🔍 Search files...] [Dropdown: All Types ▼] [Date: Any ▼] [Size: Any ▼]
```

---

### 8. Status & Empty States

**When no files uploaded:**
```
╭─────────────────────────────────────┐
│                                      │
│      📭 No Files Yet                 │
│                                      │
│   Your transferred files will        │
│   appear here when you upload        │
│   them from mobile.                  │
│                                      │
│   Scan the QR code from desktop      │
│   to send files to this device.      │
│                                      │
│         [📱 Show QR Code]            │
│                                      │
└─────────────────────────────────────┘
```

**During upload:**
```
Uploading: photo.jpg
████████░░░░░░░░░░ 45% • 1.2 MB of 2.7 MB
```

**Upload complete:**
```
✓ Successfully uploaded 3 files
  Dismiss [X]
```

---

### 9. File Type Icons & Colors

| Type    | Icon | Color  |
| ------- | ---- | ------ |
| Image   | 📸    | Blue   |
| PDF     | 📄    | Red    |
| Text    | 📝    | Gray   |
| Video   | 🎬    | Purple |
| Audio   | 🎵    | Green  |
| Archive | 📦    | Orange |
| Code    | 💻    | Teal   |
| Folder  | 📁    | Yellow |
| Unknown | ❓    | Gray   |

---

### 10. Responsive Design

**Desktop (1024px+):**
- Full sidebar visible
- Two-column layout (files + preview)
- Grid or list view

**Tablet (768px - 1024px):**
- Collapsible sidebar (hamburger menu)
- Full-width file list
- Preview panel slides in as modal

**Mobile (< 768px):**
- Hamburger menu for sidebar
- Single-column file list
- Full-screen preview on tap

---

## Technical Architecture

### 11. Component Structure

```javascript
class FileManager extends Window {
  // State Management
  state = {
    files: [],           // File list from backend
    selectedFile: null,  // Currently selected file
    selectedFiles: [],   // Multi-select
    viewMode: 'grid',    // 'grid', 'list', 'compact'
    sortBy: 'date',      // 'name', 'size', 'type', 'date'
    filterType: 'all',   // 'images', 'documents', etc.
    currentPath: [],     // Breadcrumb: ['Received Files', 'Images']
    starred: [],         // Starred file IDs
    trash: [],           // Recently deleted (7-day retention)
    searchQuery: '',     // Search filter
  }

  // Lifecycle Methods
  constructor()
  onWindowOpen()
  onWindowClose()
  render()

  // File Operations
  loadFiles()           // Fetch from backend
  selectFile(id)        // Single select
  toggleSelectFile(id)  // Multi-select
  downloadFile(id)
  deleteFile(id)
  restoreFromTrash(id)
  renameFile(id, newName)
  starFile(id)
  unstarFile(id)

  // View & Navigation
  changeViewMode(mode)  // grid/list/compact
  setSortBy(field)
  setFilter(type)
  navigateTo(path)
  searchFiles(query)

  // UI Rendering
  renderSidebar()
  renderFileList()
  renderPreview()
  renderContextMenu()
  renderBreadcrumbs()

  // File Preview
  previewImage(file)
  previewPDF(file)
  previewText(file)
  previewAudio(file)
  previewVideo(file)
}
```

---

### 12. Data Model: File Object

```javascript
{
  id: "file_default_1706123456789",
  name: "document.pdf",
  size: 2548576,           // bytes
  type: "application/pdf",
  category: "documents",
  uploadedAt: 1706123456789,
  modifiedAt: 1706123456789,
  data: "JVBERi0xLjQKJeLj...",  // base64 encoded
  metadata: {
    width: null,
    height: null,
    pages: 12,             // PDF only
    duration: null,        // Video/Audio
    exif: { ... },         // Image metadata
  },
  starred: false,
  deleted: false,
  deletedAt: null,
}
```

---

### 13. State Storage Strategy

```javascript
// Primary: In-memory (fast, but lost on refresh)
this.files = [...]

// Secondary: localStorage (persistent, 5MB limit in most browsers)
localStorage.setItem('dgc_files', JSON.stringify(files))
localStorage.setItem('dgc_file_manager_state', JSON.stringify(state))

// Tertiary: Base64 files stored in KV (via bridge API)
// Files > 5MB stored here, max 25MB per file
// 1-hour TTL by default (can be extended)
```

---

### 14. File Preview Implementation

**Images:**
```javascript
// Use <img> tag with base64 src
<img src={`data:image/jpeg;base64,${file.data}`} />
```

**PDFs:**
```javascript
// Use PDF.js library (npm install pdfjs-dist)
import * as pdfjsLib from 'pdfjs-dist'
// Render first page as canvas/image
```

**Text:**
```javascript
// Decode base64 to text
const text = atob(file.data)
// Display with syntax highlighting (Prism.js)
```

**Audio/Video:**
```javascript
// Create blob URL from base64
const blob = new Blob([binaryData], { type: file.type })
const url = URL.createObjectURL(blob)
<video src={url} controls />
<audio src={url} controls />
```

---

### 15. Integration with Existing Desktop

**Window System:**
- Inherit from existing `Window` class in index.html
- Follow DondlingerGC window lifecycle (open, minimize, maximize, close)
- Register in `System.pages` array
- Use existing taskbar integration

**Example Entry Point in index.html:**
```javascript
{
  id: 'filemanager',
  title: '📁 File Manager',
  tooltip: 'Browse and manage files transferred from mobile',
  special: true  // Custom handler, not standard embed
}
```

**Backend Integration:**
- Endpoint: `GET /api/bridge?action=pull&sessionId=default`
- Returns: Array of file objects with base64 data
- Delete: `POST /api/bridge?action=delete&fileId=xxx`
- Restore: `POST /api/bridge?action=restore&fileId=xxx`

---

## Feature Set: Must Have vs. Nice to Have

### MUST HAVE (MVP)
- ✅ Sidebar with Received Files / Images / Documents / All Files categories
- ✅ Main content area with grid view (card layout with thumbnail)
- ✅ File list with columns: Name, Size, Type, Date
- ✅ Preview panel showing file info + thumbnail preview
- ✅ Download action for selected file
- ✅ Delete action (soft delete, moved to trash)
- ✅ Search/filter by filename
- ✅ Sort options (name, size, date)
- ✅ Breadcrumb navigation
- ✅ Empty state UI
- ✅ File type categorization (auto-sort by MIME type)
- ✅ Context menu on right-click
- ✅ Multi-select with Ctrl/Cmd+Click
- ✅ Bulk delete for selected files
- ✅ Responsive design (desktop + tablet)

### NICE TO HAVE (Future Phases)
- ⏳ Thumbnail generation for video files
- ⏳ Tags/labels for custom organization
- ⏳ Drag-and-drop file organization
- ⏳ Create/rename folders
- ⏳ Undo/redo for deletions
- ⏳ Share links (public URL for each file)
- ⏳ Password-protected download links
- ⏳ Expiring file links (auto-delete after X days)
- ⏳ File compression (ZIP on-demand)
- ⏳ Batch rename with patterns
- ⏳ Advanced search (by size, date ranges, etc.)
- ⏳ File rotation for images
- ⏳ Mark as read/unread
- ⏳ Integration with other apps (open in blueprint viewer, etc.)
- ⏳ Cloud storage backends (OneDrive, Google Drive, Dropbox)
- ⏳ Real-time sync with mobile uploads
- ⏳ Desktop notifications on new file arrival

---

## UI/UX Best Practices Applied

1. **Progressive Disclosure:** Advanced options in context menu, basic actions always visible
2. **Consistency:** Follows DondlingerGC color scheme (cyan accent, dark background)
3. **Feedback:** Upload progress, toast notifications, selection states
4. **Performance:** Lazy-load thumbnails, virtualize long lists (100+ files)
5. **Accessibility:** Keyboard navigation (arrow keys, Enter, Delete), ARIA labels
6. **Responsive:** Works on desktop, tablet, mobile with appropriate layouts
7. **Error Handling:** Display user-friendly errors (not base64 garbage)
8. **Empty States:** Clear messaging when no files present

---

## Implementation Roadmap

### Phase 1: MVP (Weeks 1-2)
- File listing from backend
- Grid/list view toggle
- Single file select + preview
- Download + delete actions
- Sidebar categories
- Search + sort

### Phase 2: Enhanced UX (Weeks 3-4)
- Multi-select + bulk operations
- Context menu
- Breadcrumb navigation
- Better preview (images, PDFs, text)
- Trash/recovery
- Responsive mobile layout

### Phase 3: Advanced Features (Weeks 5+)
- Tagging system
- Drag-and-drop folders
- Compression
- Share links
- Cloud storage integration

---

## Constraints & Considerations

### Browser Limitations
- **File Size:** Max ~18-20 MB per file (base64 encoding overhead in Cloudflare KV)
- **Storage:** localStorage limit 5-10MB depending on browser
- **Memory:** Large file previews may lag browser (consider pagination)
- **No Real Filesystem:** Can't create real folders, only virtual organization

### Security
- **File Validation:** Check MIME types, not just extensions
- **Sanitization:** For PDF/text preview, ensure no XSS via embedded content
- **Sensitive Data:** Files in localStorage unencrypted; users on shared computer risk
- **Expiration:** Implement file TTL to auto-clean old transfers

### Performance
- **Pagination:** Load 50 files at a time, lazy-load rest on scroll
- **Thumbnails:** Generate small previews, not full-size images
- **Search:** Client-side search fine for <1000 files; backend search needed beyond
- **Caching:** Cache file list, invalidate on new upload

---

## Success Metrics

1. **Usability:** Users can download transferred files within 2 clicks
2. **Performance:** File list loads in < 1 second
3. **Reliability:** No data loss on refresh/reload
4. **Satisfaction:** Users prefer this to manual browser download management
5. **Integration:** Seamlessly integrates with existing desktop window system

---

## Appendix: ASCII Mockups

### Mockup 1: Grid View
```
═══════════════════════════════════════════════════════════════════
║ 📁 File Manager                                   [−] [▢] [×]   ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  📥 Received Files                                             ║
║  📸 Images (12)                                                ║
║  📄 Documents (5)                                              ║
║  🎬 Videos (2)                                                 ║
║  ⭐ Starred (0)                                                ║
║  🗑️ Trash (1)                                                 ║
║                                                                 ║
║  🏠 > Received Files  [🔍 Search...] [Type▼] [Date▼] [Size▼]  ║
║                                                                 ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          ║
║  │ 📸       │ │ 📄       │ │ 📝       │ │ 🎬       │          ║
║  │ photo1   │ │ report   │ │ notes    │ │ video1   │          ║
║  │ 4.2 MB   │ │ 2.4 MB   │ │ 12 KB    │ │ 120 MB   │          ║
║  │ Jan 29   │ │ Jan 28   │ │ Jan 30   │ │ Jan 25   │          ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────┘          ║
║                                                                 ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐                       ║
║  │ 📸       │ │ 📝       │ │ 📦       │                       ║
║  │ photo2   │ │ invoice  │ │ archive  │                       ║
║  │ 3.8 MB   │ │ 156 KB   │ │ 5.2 MB   │                       ║
║  │ Jan 28   │ │ Jan 15   │ │ Jan 10   │                       ║
║  └──────────┘ └──────────┘ └──────────┘                       ║
║                                                                 ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ PREVIEW                                                 │  ║
║  │ Filename: photo1.jpg                                    │  ║
║  │ Size: 4.2 MB                                           │  ║
║  │ Date: Jan 29, 2026 3:45 PM                            │  ║
║  │ ┌─────────────────────────────────────────────────┐   │  ║
║  │ │                                                 │   │  ║
║  │ │           [Image Thumbnail Preview]            │   │  ║
║  │ │           (Photo of something)                 │   │  ║
║  │ │                                                 │   │  ║
║  │ └─────────────────────────────────────────────────┘   │  ║
║  │ [⬇ Download] [🗑 Delete] [📋 Copy Link] [ℹ Info]      │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║  [⬇ Download All] [🗑 Delete Selected] [📋 Copy Link]         ║
║                                                                 ║
═══════════════════════════════════════════════════════════════════
```

### Mockup 2: List View
```
═══════════════════════════════════════════════════════════════════
║ 📁 File Manager                                   [−] [▢] [×]   ║
╠════════════════════════════════════════════════════════════════╣
║  🏠 > Received Files  [🔍 Search...] [Type▼] [Sort▼]           ║
║                                                                 ║
║  📁 Name ↓          Size        Type       Date          Action ║
║  ────────────────────────────────────────────────────────────── ║
║  📸 photo1.jpg      4.2 MB      Image      Jan 29, 3:45 PM ⋯  ║
║  📄 report.pdf      2.4 MB      PDF        Jan 28, 2:30 PM ⋯  ║
║  📝 notes.txt       12 KB       Text       Jan 30, 10:15 AM ⋯ ║
║  🎬 video1.mp4      120 MB      Video      Jan 25, 1:00 PM ⋯  ║
║  📸 photo2.jpg      3.8 MB      Image      Jan 28, 5:20 PM ⋯  ║
║  📝 invoice.pdf     156 KB      PDF        Jan 15, 9:45 AM ⋯  ║
║  📦 archive.zip     5.2 MB      Archive    Jan 10, 12:00 PM ⋯ ║
║                                                                 ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ PREVIEW: photo1.jpg (Selected)                         │  ║
║  │ Size: 4.2 MB | Type: JPEG | Date: Jan 29 3:45 PM     │  ║
║  │ Dimensions: 3840 x 2160                                │  ║
║  │ ┌─────────────────────────────────────────────────┐   │  ║
║  │ │                                                 │   │  ║
║  │ │           [Image Thumbnail]                    │   │  ║
║  │ │                                                 │   │  ║
║  │ └─────────────────────────────────────────────────┘   │  ║
║  │ [⬇ Download] [🗑 Delete] [📋 Copy Link] [ℹ Info]      │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                                 ║
═══════════════════════════════════════════════════════════════════
```

---

**End of Design Specification**
