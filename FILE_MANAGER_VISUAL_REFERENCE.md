# File Manager: Visual Reference & Quick Lookup

**For Quick Implementation Reference**

---

## 🎨 Component Visual Guide

### File Item Card (Grid View)
```
┌─────────────────────┐
│        📸           │
│    photo.jpg        │
│     4.2 MB          │
│    Jan 29, 3:45 PM  │
└─────────────────────┘
```

**Hover State:**
```
┌─────────────────────┐
│        📸           │
│    photo.jpg        │
│     4.2 MB          │
│    Jan 29, 3:45 PM  │
│                     │
│ [⬇] [🗑] [⭐] [ℹ]  │
└─────────────────────┘
```

**Selected State:**
```
╔═════════════════════╗
║        📸           ║
║    photo.jpg        ║
║     4.2 MB          ║
║    Jan 29, 3:45 PM  ║
╚═════════════════════╝
```

---

### File List Row (List View)
```
[✓] 📸  photo.jpg        4.2 MB    Image    Jan 29, 3:45 PM    [⋯]
    ^   ^               ^          ^        ^                   ^
   Select Icon         Name/Size  Type     Date               Menu
```

---

### Preview Panel Sections

#### Image Preview
```
┌──────────────────────┐
│  photo.jpg           │
│  Image • 4.2 MB      │
│  Jan 29, 3:45 PM     │
│  Dimensions: 3840×2160
│  ┌────────────────┐  │
│  │                │  │
│  │  [Thumbnail]   │  │
│  │                │  │
│  └────────────────┘  │
│ [⬇ Download]        │
│ [🗑 Delete] [⭐]   │
└──────────────────────┘
```

#### Document Preview
```
┌──────────────────────┐
│  report.pdf          │
│  PDF • 2.4 MB        │
│  Jan 28, 2:30 PM     │
│  Pages: 12           │
│  ┌────────────────┐  │
│  │     PDF        │  │
│  │   Document     │  │
│  │  (12 pages)    │  │
│  └────────────────┘  │
│ [⬇ Download]        │
│ [🗑 Delete] [⭐]   │
└──────────────────────┘
```

#### Text Preview
```
┌──────────────────────┐
│  notes.txt           │
│  Text • 12 KB        │
│  Jan 30, 10:15 AM    │
│  ┌────────────────┐  │
│  │ Lorem ipsum    │  │
│  │ dolor sit amet │  │
│  │ consectetur... │  │
│  └────────────────┘  │
│ [⬇ Download]        │
│ [🗑 Delete] [⭐]   │
└──────────────────────┘
```

---

### Context Menu

```
     [Right-click on file]

     ⬇ Download
     📋 Copy Path
     ✏️ Rename
     ⭐ Star
     🗑 Delete
```

---

### Sidebar Categories

```
LOCATIONS
├─ 📥 All Files
├─ 📸 Images (12)
├─ 📄 Documents (5)
├─ 🎬 Videos (2)
├─ 🎵 Audio (1)
├─ 📦 Archives (3)
└─ 💻 Code (2)

SPECIAL
├─ ⭐ Starred (0)
└─ 🗑️ Trash (1)
```

---

## 🎯 User Interaction Flows

### Flow 1: Download a File
```
User clicks file
    ↓
Preview panel shows
    ↓
User clicks "⬇ Download"
    ↓
Toast: "Downloaded: photo.jpg"
    ↓
File appears in Downloads folder
```

### Flow 2: Find and Filter Files
```
User types in search
    ↓
Real-time filter results (300ms debounce)
    ↓
List updates to show matches
    ↓
User clicks category (e.g., "Images")
    ↓
List shows only images
    ↓
User sorts by "Size"
    ↓
List re-orders by file size
```

### Flow 3: Bulk Delete
```
User Ctrl+Click selects 3 files
    ↓
Status bar shows "3 selected"
    ↓
User presses Delete key
    ↓
Confirmation: "Delete 3 files?"
    ↓
User confirms
    ↓
Files move to trash
    ↓
Toast: "Moved to trash: file1.jpg, file2.jpg, file3.jpg"
```

### Flow 4: Restore from Trash
```
User clicks "🗑️ Trash" in sidebar
    ↓
List shows deleted files
    ↓
User right-clicks file
    ↓
Context menu: "Restore"
    ↓
File returns to "All Files"
    ↓
Toast: "Restored: photo.jpg"
```

---

## 🔤 Keyboard Shortcuts

| Shortcut           | Action            |
| ------------------ | ----------------- |
| Ctrl+A / Cmd+A     | Select all files  |
| Ctrl+D / Cmd+D     | Download selected |
| Delete / Backspace | Delete selected   |
| Ctrl+F / Cmd+F     | Focus search box  |
| Arrow Up/Down      | Navigate list     |
| Enter              | Download selected |
| Esc                | Deselect all      |

---

## 🎨 Icon Reference

| Category | Icon | Color            |
| -------- | ---- | ---------------- |
| Image    | 📸    | #4A90E2 (Blue)   |
| Document | 📄    | #E74C3C (Red)    |
| Video    | 🎬    | #9B59B6 (Purple) |
| Audio    | 🎵    | #27AE60 (Green)  |
| Archive  | 📦    | #F39C12 (Orange) |
| Code     | 💻    | #16A085 (Teal)   |
| Folder   | 📁    | #F4D03F (Yellow) |
| Starred  | ⭐    | #FFD700 (Gold)   |
| Trash    | 🗑️    | #95A5A6 (Gray)   |
| Unknown  | ❓    | #7F8C8D (Gray)   |

---

## 📏 Spacing & Sizing

```css
/* Container */
.file-manager-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Toolbar */
.fm-toolbar {
  padding: 12px 16px;      /* Vertical: 12px, Horizontal: 16px */
  display: flex;
  gap: 12px;               /* Space between elements */
}

/* Sidebar */
.fm-sidebar {
  width: 180px;            /* Fixed width */
  padding-right: 12px;
  overflow-y: auto;
}

/* File Grid */
#fm-file-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;               /* Space between items */
  padding: 8px;
}

/* File Card */
.file-item {
  width: 180px;            /* Thumbnail size */
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
}

/* Preview Panel */
.fm-preview-panel {
  width: 280px;            /* Fixed width */
  padding-left: 12px;
  overflow-y: auto;
}
```

---

## 🎬 Animations

```css
/* Hover Transition */
.file-item:hover {
  transition: all 0.2s ease;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Selection Highlight */
.file-item.selected {
  border-color: #00d4ff;
  background: #e8f4ff;
  animation: slideIn 0.2s ease;
}

/* Toast Notification */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(20px);
  }
}
```

---

## 📱 Responsive Breakpoints & Adjustments

### Desktop (1920px+)
```
┌─────────────────────────────────────────────────┐
│  Sidebar │  File List          │  Preview Panel │
│  180px   │  (flex)             │  280px         │
└─────────────────────────────────────────────────┘
```

### Laptop (1366px)
```
┌─────────────────────────────────────────────────┐
│  Sidebar │  File List          │  Preview Panel │
│  160px   │  (flex)             │  260px         │
└─────────────────────────────────────────────────┘
```

### Tablet (768px)
```
┌───────────────────────────────────────┐
│ [≡ Menu]  File List (full-width)     │
├───────────────────────────────────────┤
│ [Preview Modal Slides In From Right]  │
└───────────────────────────────────────┘
```

### Mobile (375px)
```
┌──────────────────────┐
│ [≡ Menu] File List   │
│                      │
│ Preview (tap to open)
└──────────────────────┘
```

---

## 💬 Toast & Dialog Messages

### Success Messages
```
✓ Downloaded: photo.jpg
✓ Deleted: 3 files
✓ File restored: report.pdf
✓ Path copied to clipboard
```

### Error Messages
```
❌ Failed to download file
❌ Network error
❌ Storage limit exceeded
❌ File type not supported
```

### Warning Messages
```
⚠️ File will expire in 1 hour
⚠️ Large file (>15MB)
⚠️ Shared computer detected
```

### Confirmation Dialogs
```
Delete "photo.jpg"?
This can be recovered from trash for 7 days.
[Cancel] [Delete]

---

Download 5 files as ZIP?
This may take a moment.
[Cancel] [Download]

---

Permanently delete from trash?
This cannot be undone.
[Cancel] [Delete]
```

---

## 🔍 Search & Filter UI

```
┌──────────────────────────────────────────────────┐
│ [🔍 Search files...] [Type: All ▼] [Sort: Date ▼]
└──────────────────────────────────────────────────┘
```

### Filter Options
- **Type:** All, Images, Documents, Videos, Audio, Archives, Code
- **Sort:** Date (default), Name, Size, Type
- **Sort Order:** Descending (default), Ascending

---

## 🎓 Common Implementation Patterns

### Rendering a File Item
```javascript
const fileItem = document.createElement('div');
fileItem.className = 'file-item';
fileItem.dataset.fileId = file.id;
fileItem.innerHTML = `
  <div style="text-align:center; font-size:32px;">${file.getIconEmoji()}</div>
  <div style="font-weight:600; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(file.name)}</div>
  <div style="font-size:12px; color:#999;">${file.displaySize}</div>
  <div style="font-size:12px; color:#999;">${file.displayDate}</div>
`;
fileItem.addEventListener('click', () => fileManager.selectFile(file.id));
fileItem.addEventListener('contextmenu', (e) => fileManager.showContextMenu(e, file.id));
```

### Download File from Base64
```javascript
async downloadFile(fileId) {
  const file = this.getFileById(fileId);
  const binaryString = atob(file.data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}
```

### Apply Filters
```javascript
applyFilters() {
  let filtered = [...this.files];

  if (this.state.filterType !== 'all') {
    filtered = filtered.filter(f => f.category === this.state.filterType);
  }

  if (this.state.searchQuery) {
    const q = this.state.searchQuery.toLowerCase();
    filtered = filtered.filter(f => f.name.toLowerCase().includes(q));
  }

  filtered.sort((a, b) => {
    const comparison = this.compareBy(a, b, this.state.sortBy);
    return this.state.sortOrder === 'desc' ? -comparison : comparison;
  });

  this.displayedFiles = filtered;
  this.renderFileList();
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Base64 Image Not Displaying
```javascript
// ❌ WRONG
<img src={file.data} />

// ✅ CORRECT
<img src={`data:${file.mimeType};base64,${file.data}`} />
```

### Issue: Long Filenames Breaking Layout
```css
/* Use text truncation */
.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* Or use word-break for grid items */
.file-item {
  word-break: break-all;
}
```

### Issue: localStorage Quota Exceeded
```javascript
try {
  localStorage.setItem('key', data);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    console.warn('Storage full - only cache metadata');
    // Cache metadata only, not full base64
  }
}
```

### Issue: Selection Persisting After Filter
```javascript
// After filtering, clear selection
this.state.selectedFileIds.clear();
this.state.selectedFileId = null;
this.renderFileList();
```

---

## 📊 Sample Data for Testing

```javascript
const sampleFiles = [
  {
    id: 'file_default_1706123456789',
    name: 'photo.jpg',
    size: 4398080,
    mimeType: 'image/jpeg',
    uploadedAt: 1706123456789,
    modifiedAt: 1706123456789,
  },
  {
    id: 'file_default_1706109876543',
    name: 'report.pdf',
    size: 2548576,
    mimeType: 'application/pdf',
    uploadedAt: 1706109876543,
    modifiedAt: 1706109876543,
  },
  {
    id: 'file_default_1705987654321',
    name: 'notes.txt',
    size: 12288,
    mimeType: 'text/plain',
    uploadedAt: 1705987654321,
    modifiedAt: 1705987654321,
  },
];
```

---

## 🧩 Integration Checklist

- [ ] Add FileManager to `System.pages` in index.html
- [ ] Create `js/file-manager.js` file
- [ ] Import FileManager in index.html `<head>`
- [ ] Add 'filemanager' case to `loadWindowContent()`
- [ ] Update `/api/bridge` if new endpoints needed
- [ ] Test file polling from backend
- [ ] Verify localStorage persistence
- [ ] Test download functionality
- [ ] Test mobile responsive view
- [ ] Add to launch menu (START button)

---

## 🎯 One-Page Implementation Guide

1. **Create FileManager class** - 50 lines scaffold
2. **Add render() method** - HTML structure
3. **Add renderSidebar()** - Categories
4. **Add renderFileList()** - File grid
5. **Add renderPreview()** - File details
6. **Add loadFiles()** - Fetch from backend
7. **Add downloadFile()** - Blob download
8. **Add deleteFile()** - Soft delete
9. **Add event listeners** - Search, filter, sort
10. **Test and polish** - UI/UX refinements

**Total: ~1000 lines of well-organized JavaScript**

---

**This is a complete visual reference guide for the FileManager UI/UX.**

**Use this document alongside the detailed specifications for quick lookups during development.**
