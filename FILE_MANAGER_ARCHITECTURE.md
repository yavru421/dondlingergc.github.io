# File Manager Technical Architecture
## Implementation Guide for DondlingerGC Desktop

**Document Version:** 1.0
**Date:** January 30, 2026

---

## Overview

This document provides the technical blueprint for implementing the FileManager class as an integrated window in the DondlingerGC desktop system. It covers class structure, state management, backend integration, and code patterns.

---

## 1. FileManager Class Architecture

### 1.1 Class Definition & Inheritance

```javascript
/**
 * FileManager - Integrated file browser window
 * Manages display, preview, and operations on transferred files
 * Extends the desktop window system paradigm
 */
class FileManager {
  constructor() {
    // Window Metadata
    this.id = 'filemanager';
    this.title = '📁 File Manager';
    this.windowId = 'filemanager-window';
    this.width = 900;
    this.height = 700;

    // State
    this.state = this.initializeState();

    // UI References
    this.elements = {};

    // File Storage
    this.files = [];
    this.trash = [];

    // Configuration
    this.config = {
      itemsPerPage: 50,
      thumbnailSize: 180,
      previewMaxWidth: 300,
      trashRetentionDays: 7,
    };

    // Performance
    this.debounceDelay = 300;
    this.debounceTimer = null;
  }

  // ============================================
  // INITIALIZATION & LIFECYCLE
  // ============================================

  initializeState() {
    return {
      // View Configuration
      viewMode: localStorage.getItem('dgc_fm_viewMode') || 'grid',  // 'grid', 'list', 'compact'
      sortBy: localStorage.getItem('dgc_fm_sortBy') || 'date',      // 'name', 'size', 'type', 'date'
      sortOrder: localStorage.getItem('dgc_fm_sortOrder') || 'desc', // 'asc', 'desc'

      // Filters
      filterType: 'all',           // 'all', 'images', 'documents', 'videos', 'audio', 'archives'
      searchQuery: '',
      dateRangeStart: null,
      dateRangeEnd: null,
      minSize: null,
      maxSize: null,

      // Navigation
      currentPath: ['Received Files'],
      breadcrumbs: [
        { label: '🏠', path: [] },
        { label: 'Received Files', path: ['Received Files'] }
      ],

      // Selection
      selectedFileId: null,
      selectedFileIds: new Set(),

      // UI State
      showPreview: true,
      previewCollapsed: false,
      sidebarCollapsed: false,
      contextMenuVisible: false,
      contextMenuX: 0,
      contextMenuY: 0,

      // Starred & Trash
      starredFileIds: JSON.parse(localStorage.getItem('dgc_fm_starred') || '[]'),
      deletedFileIds: new Set(),

      // Pagination
      currentPage: 1,
      itemsPerPage: 50,

      // Metadata
      lastSync: 0,
      isLoading: false,
      error: null,
    };
  }

  async onWindowOpen() {
    console.log('[FileManager] Window opening...');
    this.render();
    await this.loadFiles();
    this.attachEventListeners();
    this.startAutoSync();
  }

  onWindowClose() {
    console.log('[FileManager] Window closing...');
    this.saveState();
    this.stopAutoSync();
    this.detachEventListeners();
  }

  saveState() {
    localStorage.setItem('dgc_fm_state', JSON.stringify(this.state));
    localStorage.setItem('dgc_fm_starred', JSON.stringify(this.state.starredFileIds));
  }
}
```

---

## 2. State Management

### 2.1 File Object Model

```javascript
/**
 * File Data Structure
 * Represents a single transferred file
 */
class FileItem {
  constructor(data) {
    // Metadata from backend
    this.id = data.id;                           // Unique ID from bridge
    this.name = data.name;
    this.size = data.size;                       // Bytes
    this.mimeType = data.mimeType;
    this.uploadedAt = data.uploadedAt;           // Timestamp
    this.modifiedAt = data.modifiedAt;           // Timestamp

    // Derived properties
    this.extension = this.getExtension();
    this.category = this.categorizeByType();
    this.displaySize = this.formatSize();
    this.displayDate = this.formatDate();

    // UI state
    this.selected = false;
    this.isStarred = false;
    this.isDeleted = false;
    this.deletedAt = null;

    // Preview data (lazy-loaded)
    this.thumbnail = null;           // Base64 or blob URL
    this.previewData = null;
    this.metadata = {
      width: null,
      height: null,
      pages: null,
      duration: null,
      exif: null,
    };

    // Full file data (base64 from backend)
    this.data = data.data;
  }

  getExtension() {
    return this.name.split('.').pop().toLowerCase() || '';
  }

  categorizeByType() {
    const mimeType = this.mimeType || '';

    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';

    if (['pdf', 'docx', 'doc', 'txt', 'md'].includes(this.extension))
      return 'documents';

    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(this.extension))
      return 'archives';

    if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(this.extension))
      return 'code';

    return 'other';
  }

  formatSize() {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  formatDate() {
    const date = new Date(this.uploadedAt);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getIconEmoji() {
    const icons = {
      'images': '📸',
      'documents': '📄',
      'videos': '🎬',
      'audio': '🎵',
      'archives': '📦',
      'code': '💻',
      'other': '❓'
    };
    return icons[this.category] || '📁';
  }

  getDisplayPath() {
    return `Received Files / ${this.category} / ${this.name}`;
  }
}
```

### 2.2 State Methods

```javascript
// File Loading
async loadFiles() {
  this.state.isLoading = true;
  this.updateLoadingUI();

  try {
    // Fetch from bridge API
    const response = await fetch(`/api/bridge?action=pull&sessionId=default`);
    if (!response.ok) throw new Error('Failed to fetch files');

    const fileData = await response.json();
    if (!fileData || !Array.isArray(fileData)) {
      console.warn('[FileManager] Invalid response from backend');
      this.files = [];
      return;
    }

    // Convert to FileItem objects
    this.files = fileData.map(data => new FileItem(data));

    // Load from localStorage cache as fallback
    this.loadCachedFiles();

    this.state.lastSync = Date.now();
    this.applyFilters();
    this.renderFileList();

  } catch (error) {
    console.error('[FileManager] Load error:', error);
    this.state.error = error.message;
    this.showError(`Failed to load files: ${error.message}`);

    // Try cache
    this.loadCachedFiles();
  } finally {
    this.state.isLoading = false;
    this.updateLoadingUI();
  }
}

loadCachedFiles() {
  try {
    const cached = localStorage.getItem('dgc_fm_files');
    if (cached) {
      const cachedFiles = JSON.parse(cached);
      this.files = cachedFiles.map(data => new FileItem(data));
    }
  } catch (error) {
    console.warn('[FileManager] Cache load failed:', error);
  }
}

cacheFiles() {
  try {
    const serializable = this.files.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      uploadedAt: f.uploadedAt,
      modifiedAt: f.modifiedAt,
      // Don't cache full base64 data to save space
    }));

    localStorage.setItem('dgc_fm_files', JSON.stringify(serializable));
  } catch (error) {
    console.warn('[FileManager] Cache save failed (likely quota):', error);
  }
}

// Filtering & Sorting
applyFilters() {
  let filtered = [...this.files];

  // Filter by type
  if (this.state.filterType !== 'all') {
    filtered = filtered.filter(f => f.category === this.state.filterType);
  }

  // Filter by search query
  if (this.state.searchQuery) {
    const query = this.state.searchQuery.toLowerCase();
    filtered = filtered.filter(f =>
      f.name.toLowerCase().includes(query)
    );
  }

  // Filter by date range
  if (this.state.dateRangeStart) {
    filtered = filtered.filter(f => f.uploadedAt >= this.state.dateRangeStart);
  }
  if (this.state.dateRangeEnd) {
    filtered = filtered.filter(f => f.uploadedAt <= this.state.dateRangeEnd);
  }

  // Filter by size range
  if (this.state.minSize !== null) {
    filtered = filtered.filter(f => f.size >= this.state.minSize);
  }
  if (this.state.maxSize !== null) {
    filtered = filtered.filter(f => f.size <= this.state.maxSize);
  }

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (this.state.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
        comparison = a.uploadedAt - b.uploadedAt;
        break;
      case 'type':
        comparison = a.extension.localeCompare(b.extension);
        break;
    }

    return this.state.sortOrder === 'desc' ? -comparison : comparison;
  });

  this.displayedFiles = filtered;
  return filtered;
}

setSortBy(field) {
  // Toggle sort order if clicking same field
  if (this.state.sortBy === field) {
    this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    this.state.sortBy = field;
    this.state.sortOrder = 'desc';
  }

  localStorage.setItem('dgc_fm_sortBy', this.state.sortBy);
  localStorage.setItem('dgc_fm_sortOrder', this.state.sortOrder);

  this.applyFilters();
  this.renderFileList();
}

setFilter(type) {
  this.state.filterType = type;
  this.applyFilters();
  this.renderFileList();
}

search(query) {
  this.state.searchQuery = query.trim();

  // Debounce search
  clearTimeout(this.debounceTimer);
  this.debounceTimer = setTimeout(() => {
    this.applyFilters();
    this.renderFileList();
  }, this.debounceDelay);
}
```

---

## 3. File Operations

### 3.1 Download, Delete, Restore

```javascript
async downloadFile(fileId) {
  const file = this.getFileById(fileId);
  if (!file) return;

  try {
    // Decode base64 to binary
    const binaryString = atob(file.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob and download
    const blob = new Blob([bytes], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showNotification(`✓ Downloaded: ${file.name}`);

  } catch (error) {
    console.error('[FileManager] Download failed:', error);
    this.showError(`Failed to download ${file.name}`);
  }
}

async downloadMultiple(fileIds) {
  // For multiple files, create a ZIP archive
  // Requires JSZip library (npm install jszip)
  const JSZip = window.JSZip;
  if (!JSZip) {
    this.showError('ZIP download not available. Download files individually.');
    return;
  }

  const zip = new JSZip();

  for (const fileId of fileIds) {
    const file = this.getFileById(fileId);
    if (!file) continue;

    const binaryString = atob(file.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    zip.file(file.name, bytes);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `files_${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  this.showNotification(`✓ Downloaded ${fileIds.length} files as ZIP`);
}

deleteFile(fileId) {
  const file = this.getFileById(fileId);
  if (!file) return;

  // Show confirmation
  if (!confirm(`Delete "${file.name}"? (recoverable for 7 days)`)) return;

  file.isDeleted = true;
  file.deletedAt = Date.now();
  this.state.deletedFileIds.add(fileId);

  this.trash.push(file);
  this.removeFromDisplayedFiles(fileId);
  this.renderFileList();
  this.showNotification(`Moved to trash: ${file.name}`);
  this.saveState();
}

deleteMultiple(fileIds) {
  const count = fileIds.size;
  if (!confirm(`Delete ${count} files? (recoverable for 7 days)`)) return;

  fileIds.forEach(fileId => {
    const file = this.getFileById(fileId);
    if (file) {
      file.isDeleted = true;
      file.deletedAt = Date.now();
      this.trash.push(file);
      this.removeFromDisplayedFiles(fileId);
    }
  });

  this.state.deletedFileIds = new Set([...this.state.deletedFileIds, ...fileIds]);
  this.state.selectedFileIds.clear();
  this.renderFileList();
  this.showNotification(`${count} files moved to trash`);
  this.saveState();
}

permanentlyDeleteFile(fileId) {
  if (!confirm('Permanently delete? This cannot be undone.')) return;

  const index = this.trash.findIndex(f => f.id === fileId);
  if (index !== -1) {
    const file = this.trash[index];
    this.trash.splice(index, 1);
    this.state.deletedFileIds.delete(fileId);

    this.renderTrash();
    this.showNotification(`Permanently deleted: ${file.name}`);
    this.saveState();
  }
}

restoreFromTrash(fileId) {
  const file = this.trash.find(f => f.id === fileId);
  if (!file) return;

  file.isDeleted = false;
  file.deletedAt = null;
  this.state.deletedFileIds.delete(fileId);

  // Move back to main files
  this.files.push(file);
  this.trash = this.trash.filter(f => f.id !== fileId);

  this.applyFilters();
  this.renderFileList();
  this.showNotification(`Restored: ${file.name}`);
  this.saveState();
}

emptyTrash() {
  const count = this.trash.length;
  if (!confirm(`Permanently delete all ${count} files in trash?`)) return;

  this.trash = [];
  this.state.deletedFileIds.clear();

  this.renderTrash();
  this.showNotification('Trash emptied');
  this.saveState();
}

// Cleanup expired trash (7 days)
cleanupExpiredTrash() {
  const now = Date.now();
  const retentionMs = this.config.trashRetentionDays * 24 * 60 * 60 * 1000;

  this.trash = this.trash.filter(file => {
    const isExpired = (now - file.deletedAt) > retentionMs;
    if (isExpired) {
      this.state.deletedFileIds.delete(file.id);
    }
    return !isExpired;
  });

  this.saveState();
}
```

### 3.2 Selection & Metadata

```javascript
selectFile(fileId, clearPrevious = true) {
  if (clearPrevious) {
    this.state.selectedFileIds.clear();
  }

  this.state.selectedFileId = fileId;
  this.state.selectedFileIds.add(fileId);

  // Update UI
  this.renderFileList();
  this.renderPreview(fileId);
}

toggleSelectFile(fileId) {
  if (this.state.selectedFileIds.has(fileId)) {
    this.state.selectedFileIds.delete(fileId);
  } else {
    this.state.selectedFileIds.add(fileId);
  }

  if (this.state.selectedFileIds.size === 1) {
    this.state.selectedFileId = fileId;
  }

  this.renderFileList();
  if (this.state.selectedFileIds.size === 1) {
    this.renderPreview(fileId);
  }
}

selectAll() {
  this.displayedFiles.forEach(file => {
    this.state.selectedFileIds.add(file.id);
  });
  this.renderFileList();
}

deselectAll() {
  this.state.selectedFileIds.clear();
  this.state.selectedFileId = null;
  this.renderFileList();
}

toggleStar(fileId) {
  const file = this.getFileById(fileId);
  if (!file) return;

  if (this.state.starredFileIds.includes(fileId)) {
    this.state.starredFileIds = this.state.starredFileIds.filter(id => id !== fileId);
    file.isStarred = false;
  } else {
    this.state.starredFileIds.push(fileId);
    file.isStarred = true;
  }

  this.renderFileList();
  this.saveState();
}

renameFile(fileId, newName) {
  const file = this.getFileById(fileId);
  if (!file) return;

  // Validate new name
  if (!newName || newName.trim() === '') {
    this.showError('File name cannot be empty');
    return;
  }

  const oldName = file.name;
  file.name = newName;
  file.extension = file.getExtension();

  this.renderFileList();
  this.showNotification(`Renamed: ${oldName} → ${newName}`);
  this.saveState();
}

copyToClipboard(fileId) {
  const file = this.getFileById(fileId);
  if (!file) return;

  // Copy file path to clipboard
  const text = file.getDisplayPath();
  navigator.clipboard.writeText(text).then(() => {
    this.showNotification('Path copied to clipboard');
  }).catch(err => {
    console.error('Clipboard copy failed:', err);
  });
}
```

---

## 4. UI Rendering

### 4.1 Main Render Methods

```javascript
render() {
  console.log('[FileManager] Rendering...');

  const container = this.ensureContainer();
  container.innerHTML = `
    <div class="file-manager-container" style="display:flex; height:100%; flex-direction:column; background:#fff; color:#000;">

      <!-- Toolbar -->
      <div class="fm-toolbar" style="padding:12px 16px; background:#f5f5f5; border-bottom:1px solid #ddd; display:flex; gap:12px; align-items:center;">
        <input type="text" id="fm-search" placeholder="🔍 Search files..."
          style="flex:1; padding:8px 12px; border:1px solid #ccc; border-radius:6px; font-size:14px;">

        <select id="fm-filter-type" style="padding:8px 12px; border:1px solid #ccc; border-radius:6px; font-size:14px;">
          <option value="all">All Types</option>
          <option value="images">Images</option>
          <option value="documents">Documents</option>
          <option value="videos">Videos</option>
          <option value="audio">Audio</option>
          <option value="archives">Archives</option>
          <option value="code">Code</option>
        </select>

        <select id="fm-sort-by" style="padding:8px 12px; border:1px solid #ccc; border-radius:6px; font-size:14px;">
          <option value="date">Sort: Date</option>
          <option value="name">Sort: Name</option>
          <option value="size">Sort: Size</option>
          <option value="type">Sort: Type</option>
        </select>

        <div style="display:flex; gap:6px;">
          <button id="fm-view-grid" title="Grid view" style="padding:6px 12px; background:#007bff; color:#fff; border:none; border-radius:4px; cursor:pointer;">⊞</button>
          <button id="fm-view-list" title="List view" style="padding:6px 12px; background:#ccc; color:#000; border:none; border-radius:4px; cursor:pointer;">≡</button>
        </div>
      </div>

      <!-- Breadcrumb -->
      <div class="fm-breadcrumb" id="fm-breadcrumb" style="padding:8px 16px; background:#f9f9f9; border-bottom:1px solid #eee; font-size:14px; display:flex; align-items:center; gap:4px;">
      </div>

      <!-- Main Content -->
      <div style="display:flex; flex:1; overflow:hidden; gap:12px; padding:12px;">

        <!-- Sidebar -->
        <div class="fm-sidebar" id="fm-sidebar" style="width:180px; border-right:1px solid #ddd; padding-right:12px; overflow-y:auto;">
        </div>

        <!-- Files Area -->
        <div class="fm-main" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
          <div id="fm-file-list" style="flex:1; overflow-y:auto; padding:8px; display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:16px;">
          </div>
        </div>

        <!-- Preview Panel -->
        <div class="fm-preview-panel" id="fm-preview" style="width:280px; border-left:1px solid #ddd; padding-left:12px; overflow-y:auto;">
        </div>
      </div>

      <!-- Status Bar -->
      <div class="fm-statusbar" style="padding:8px 16px; background:#f5f5f5; border-top:1px solid #ddd; font-size:12px; color:#666;">
        <span id="fm-status"></span>
      </div>
    </div>
  `;

  this.elements = {
    container,
    sidebar: container.querySelector('#fm-sidebar'),
    fileList: container.querySelector('#fm-file-list'),
    preview: container.querySelector('#fm-preview'),
    search: container.querySelector('#fm-search'),
    filterType: container.querySelector('#fm-filter-type'),
    sortBy: container.querySelector('#fm-sort-by'),
    breadcrumb: container.querySelector('#fm-breadcrumb'),
    statusbar: container.querySelector('#fm-status'),
  };

  this.renderSidebar();
  this.renderBreadcrumb();
  this.updateStatusBar();
}

renderSidebar() {
  const sidebar = this.elements.sidebar;
  sidebar.innerHTML = `
    <div class="fm-sidebar-section" style="margin-bottom:16px;">
      <div style="font-weight:600; font-size:13px; margin-bottom:8px; color:#333;">LOCATIONS</div>
      ${this.renderSidebarItem('Received Files', 'all')}
      ${this.renderSidebarItem('Images', 'images')}
      ${this.renderSidebarItem('Documents', 'documents')}
      ${this.renderSidebarItem('Videos', 'videos')}
      ${this.renderSidebarItem('Audio', 'audio')}
      ${this.renderSidebarItem('Archives', 'archives')}
      ${this.renderSidebarItem('Code', 'code')}
    </div>

    <div class="fm-sidebar-section" style="margin-bottom:16px;">
      <div style="font-weight:600; font-size:13px; margin-bottom:8px; color:#333;">SPECIAL</div>
      ${this.renderSidebarItem('⭐ Starred', 'starred')}
      ${this.renderSidebarItem('🗑️ Trash', 'trash', this.trash.length)}
    </div>
  `;
}

renderSidebarItem(label, filter, count = null) {
  const isActive = this.state.filterType === filter;
  const countStr = count !== null ? ` (${count})` : '';
  const style = isActive
    ? 'background:#00d4ff; color:#000; font-weight:600;'
    : 'background:transparent; color:#666;';

  return `
    <div onclick="fileManager.setSidebarFilter('${filter}')"
      style="padding:8px 12px; border-radius:6px; cursor:pointer; font-size:13px; ${style}; transition:all 0.2s;">
      ${label}${countStr}
    </div>
  `;
}

renderBreadcrumb() {
  const breadcrumb = this.elements.breadcrumb;
  let html = '<span style="cursor:pointer; color:#007bff;" onclick="fileManager.navigateTo([])">🏠 Home</span>';

  this.state.currentPath.forEach((segment, index) => {
    html += ' > ';
    const path = this.state.currentPath.slice(0, index + 1);
    html += `<span style="cursor:pointer; color:#007bff;" onclick="fileManager.navigateTo(${JSON.stringify(path)})">${segment}</span>`;
  });

  breadcrumb.innerHTML = html;
}

renderFileList() {
  const fileList = this.elements.fileList;

  if (this.displayedFiles.length === 0) {
    fileList.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:40px; color:#999;">
        <div style="font-size:32px; margin-bottom:16px;">📭</div>
        <div style="font-size:16px; font-weight:600; margin-bottom:8px;">No Files Found</div>
        <div style="font-size:14px;">Try adjusting your search or filters</div>
      </div>
    `;
    return;
  }

  fileList.innerHTML = this.displayedFiles.map(file => {
    const isSelected = this.state.selectedFileIds.has(file.id);
    const style = isSelected ? 'border-color:#00d4ff; background:#e8f4ff;' : '';

    return `
      <div class="file-item" style="
        border:2px solid #ddd;
        border-radius:8px;
        padding:12px;
        cursor:pointer;
        transition:all 0.2s;
        ${style}
      " onclick="fileManager.selectFile('${file.id}')" oncontextmenu="fileManager.showContextMenu(event, '${file.id}')">
        <div style="text-align:center; font-size:32px; margin-bottom:8px;">${file.getIconEmoji()}</div>
        <div style="font-weight:600; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${file.name}</div>
        <div style="font-size:12px; color:#999; margin-top:4px;">${file.displaySize}</div>
        <div style="font-size:12px; color:#999;">${file.displayDate}</div>
      </div>
    `;
  }).join('');
}

renderPreview(fileId) {
  const file = this.getFileById(fileId);
  if (!file) {
    this.elements.preview.innerHTML = '<div style="color:#999; text-align:center; padding:24px;">Select a file to preview</div>';
    return;
  }

  let previewHTML = `
    <div style="padding:12px 0;">
      <div style="font-weight:600; font-size:14px; margin-bottom:4px; word-break:break-all;">${file.name}</div>
      <div style="font-size:12px; color:#666; margin-bottom:12px;">
        <div>${file.displaySize} • ${file.extension.toUpperCase()}</div>
        <div>${file.displayDate}</div>
      </div>
  `;

  // Thumbnail based on type
  if (file.category === 'images') {
    previewHTML += `
      <div style="margin:12px 0; border-radius:6px; overflow:hidden;">
        <img src="data:${file.mimeType};base64,${file.data}" style="max-width:100%; max-height:200px; display:block;">
      </div>
    `;
  } else if (file.category === 'documents' && file.extension === 'pdf') {
    previewHTML += `
      <div style="margin:12px 0; background:#f5f5f5; padding:12px; border-radius:6px; text-align:center; color:#999;">
        PDF Document (${file.metadata.pages || '?'} pages)
      </div>
    `;
  } else if (file.category === 'code' || file.extension === 'txt') {
    const preview = atob(file.data).substring(0, 300);
    previewHTML += `
      <div style="margin:12px 0; background:#f5f5f5; padding:12px; border-radius:6px; font-size:11px; font-family:monospace; overflow:auto; max-height:150px;">
        ${preview.replace(/</g, '&lt;').replace(/>/g, '&gt;')}...
      </div>
    `;
  }

  previewHTML += `
    <div style="display:flex; gap:8px; margin-top:16px;">
      <button onclick="fileManager.downloadFile('${fileId}')" style="flex:1; padding:8px; background:#28a745; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:13px;">⬇ Download</button>
      <button onclick="fileManager.deleteFile('${fileId}')" style="flex:1; padding:8px; background:#dc3545; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:13px;">🗑 Delete</button>
      <button onclick="fileManager.toggleStar('${fileId}')" style="flex:1; padding:8px; background:#ffc107; color:#000; border:none; border-radius:4px; cursor:pointer; font-size:13px;">⭐</button>
    </div>
  `;

  previewHTML += '</div>';
  this.elements.preview.innerHTML = previewHTML;
}

updateStatusBar() {
  const selected = this.state.selectedFileIds.size;
  const total = this.displayedFiles.length;
  const allCount = this.files.length;

  let status = `${total} file${total !== 1 ? 's' : ''} in view`;
  if (selected > 0) {
    status += ` • ${selected} selected`;
  }
  if (total < allCount) {
    status += ` (${allCount} total)`;
  }

  this.elements.statusbar.textContent = status;
}
```

---

## 5. Event Handling & Integration

### 5.1 Event Listeners

```javascript
attachEventListeners() {
  // Search
  this.elements.search.addEventListener('input', (e) => {
    this.search(e.target.value);
  });

  // Filter
  this.elements.filterType.addEventListener('change', (e) => {
    this.setFilter(e.target.value);
  });

  // Sort
  this.elements.sortBy.addEventListener('change', (e) => {
    this.setSortBy(e.target.value);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => this.handleKeydown(e));

  // Drag & drop
  this.elements.fileList.addEventListener('dragover', (e) => this.handleDragOver(e));
  this.elements.fileList.addEventListener('drop', (e) => this.handleDrop(e));
}

handleKeydown(event) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'a': // Select All
        event.preventDefault();
        this.selectAll();
        break;
      case 'd': // Download
        if (this.state.selectedFileId) {
          this.downloadFile(this.state.selectedFileId);
        }
        break;
    }
  }

  if (event.key === 'Delete') {
    if (this.state.selectedFileIds.size > 0) {
      this.deleteMultiple(this.state.selectedFileIds);
    }
  }
}

showContextMenu(event, fileId) {
  event.preventDefault();

  const menu = document.createElement('div');
  menu.style.cssText = `
    position:fixed;
    top:${event.clientY}px;
    left:${event.clientX}px;
    background:#fff;
    border:1px solid #ddd;
    border-radius:6px;
    box-shadow:0 4px 12px rgba(0,0,0,0.15);
    z-index:10000;
    padding:4px 0;
  `;

  const file = this.getFileById(fileId);
  const items = [
    { label: '⬇ Download', action: () => this.downloadFile(fileId) },
    { label: '📋 Copy Path', action: () => this.copyToClipboard(fileId) },
    { label: '✏️ Rename', action: () => this.promptRename(fileId) },
    { label: file?.isStarred ? '☆ Unstar' : '⭐ Star', action: () => this.toggleStar(fileId) },
    { label: '🗑 Delete', action: () => this.deleteFile(fileId) },
  ];

  items.forEach(item => {
    const div = document.createElement('div');
    div.textContent = item.label;
    div.style.cssText = `
      padding:8px 16px;
      cursor:pointer;
      font-size:13px;
      transition:background 0.2s;
    `;
    div.onmouseenter = () => div.style.background = '#f5f5f5';
    div.onmouseleave = () => div.style.background = 'transparent';
    div.onclick = () => {
      item.action();
      menu.remove();
    };
    menu.appendChild(div);
  });

  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('click', () => menu.remove(), { once: true });
  }, 0);
}
```

### 5.2 Auto-Sync & Polling

```javascript
startAutoSync() {
  this.syncInterval = setInterval(() => {
    this.pollNewFiles();
    this.cleanupExpiredTrash();
  }, 5000); // Every 5 seconds
}

stopAutoSync() {
  clearInterval(this.syncInterval);
}

async pollNewFiles() {
  try {
    const response = await fetch(`/api/bridge?action=pull&sessionId=default`);
    if (!response.ok) return;

    const newFileData = await response.json();
    if (!newFileData) return;

    // Check for new files
    const newFileIds = new Set(newFileData.map(f => f.id));
    const existingIds = new Set(this.files.map(f => f.id));

    let hasNewFiles = false;
    newFileData.forEach(fileData => {
      if (!existingIds.has(fileData.id)) {
        this.files.push(new FileItem(fileData));
        hasNewFiles = true;
      }
    });

    if (hasNewFiles) {
      this.applyFilters();
      this.renderFileList();
      this.cacheFiles();
      this.showNotification(`✓ New file(s) received`);
    }

  } catch (error) {
    console.warn('[FileManager] Poll error:', error);
  }
}
```

---

## 6. Helper Methods

```javascript
getFileById(fileId) {
  return this.files.find(f => f.id === fileId) ||
         this.trash.find(f => f.id === fileId);
}

removeFromDisplayedFiles(fileId) {
  this.displayedFiles = this.displayedFiles.filter(f => f.id !== fileId);
}

ensureContainer() {
  let container = document.getElementById(`${this.windowId}-content`);
  if (!container) {
    container = document.createElement('div');
    container.id = `${this.windowId}-content`;
    document.getElementById('windows-container').appendChild(container);
  }
  return container;
}

navigateTo(path) {
  this.state.currentPath = path;
  this.renderBreadcrumb();
}

promptRename(fileId) {
  const file = this.getFileById(fileId);
  if (!file) return;

  const newName = prompt(`Rename "${file.name}" to:`, file.name);
  if (newName && newName !== file.name) {
    this.renameFile(fileId, newName);
  }
}

showNotification(message) {
  // Use existing desktop notification system if available
  const notification = document.createElement('div');
  notification.style.cssText = `
    position:fixed;
    top:20px;
    right:20px;
    background:#28a745;
    color:#fff;
    padding:12px 16px;
    border-radius:6px;
    box-shadow:0 4px 12px rgba(0,0,0,0.15);
    z-index:10001;
    animation:slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

showError(message) {
  const error = document.createElement('div');
  error.style.cssText = `
    position:fixed;
    top:20px;
    right:20px;
    background:#dc3545;
    color:#fff;
    padding:12px 16px;
    border-radius:6px;
    box-shadow:0 4px 12px rgba(0,0,0,0.15);
    z-index:10001;
  `;
  error.textContent = '❌ ' + message;
  document.body.appendChild(error);

  setTimeout(() => error.remove(), 5000);
}

updateLoadingUI() {
  if (this.state.isLoading) {
    this.elements.fileList.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">Loading...</div>';
  }
}

detachEventListeners() {
  this.elements.search?.removeEventListener('input', this.handleSearch);
  this.elements.filterType?.removeEventListener('change', this.handleFilterChange);
  document.removeEventListener('keydown', this.handleKeydown);
}
```

---

## 7. Integration into index.html

### 7.1 Add to Windows Initialization

In `index.html`, add FileManager to the pages array:

```javascript
this.pages.push(
  {
    id: 'filemanager',
    title: '📁 File Manager',
    special: true,
    tooltip: 'Browse and manage files transferred from mobile'
  }
);
```

### 7.2 Window Content Loader

In `loadWindowContent()` method:

```javascript
} else if (page.id === 'filemanager') {
  window.fileManager = new FileManager();
  window.fileManager.onWindowOpen();
}
```

### 7.3 Include FileManager Script

Add to `<head>` of index.html:

```html
<script src="js/file-manager.js"></script>
```

---

## 8. Performance Optimization

```javascript
// Virtualize long file lists
renderVirtualizedList() {
  const itemHeight = 80;
  const visibleCount = Math.ceil(this.elements.fileList.offsetHeight / itemHeight);
  const startIndex = Math.floor(this.scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 5, this.displayedFiles.length);

  // Only render visible items + buffer
  this.displayedFiles.slice(startIndex, endIndex).forEach(file => {
    // Render file item
  });
}

// Debounce expensive operations
debounce(func, delay) {
  clearTimeout(this.debounceTimer);
  this.debounceTimer = setTimeout(func, delay);
}

// Lazy-load file thumbnails
lazyLoadThumbnails() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fileId = entry.target.dataset.fileId;
        this.generateThumbnail(fileId);
      }
    });
  });

  document.querySelectorAll('[data-file-id]').forEach(el => observer.observe(el));
}

// Cache file operations
cacheFilesWithQuota() {
  try {
    const limited = this.files.slice(0, 50); // Cache only first 50
    localStorage.setItem('dgc_fm_files', JSON.stringify(limited));
  } catch (error) {
    // Gracefully handle quota exceeded
    console.warn('localStorage full');
  }
}
```

---

## 9. Error Handling Strategy

```javascript
handleError(context, error) {
  console.error(`[FileManager:${context}]`, error);

  this.state.error = error.message;

  if (error.name === 'QuotaExceededError') {
    this.showError('Storage limit exceeded. Try freeing up browser storage.');
  } else if (error.message.includes('Failed to fetch')) {
    this.showError('Network error. Please check your connection.');
  } else if (error.message.includes('Invalid')) {
    this.showError('Invalid file format or corrupted data.');
  } else {
    this.showError(`Error: ${error.message}`);
  }
}
```

---

**End of Technical Architecture Document**
