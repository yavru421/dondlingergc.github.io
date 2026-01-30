/**
 * FileManager - Integrated file browser window for DondlingerGC Desktop
 *
 * ⚠️ CRITICAL: This file must be side-effect free on load.
 * Nothing executes unless FileManager.onWindowOpen() is called from index.html
 */

class FileManager {
    constructor() {
        // Window ID - used for targeting specific window in DOM
        this.windowId = 'filemanager';

        // State management
        this.state = {
            isLoading: false,
            filterType: 'all', // 'all', 'images', 'documents', 'videos', 'audio', 'archives', 'code', 'starred', 'trash'
            sortBy: 'date',    // 'name', 'size', 'type', 'date'
            sortOrder: 'desc', // 'asc', 'desc'
            searchQuery: '',
            selectedFileIds: new Set(),
            currentPath: 'Received Files',
            isGridView: true   // toggle between grid and list view
        };

        // File collections
        this.files = [];           // All files from backend
        this.displayedFiles = [];  // Filtered/sorted files
        this.trash = [];           // Soft-deleted files
        this.starred = new Set();  // Starred file IDs

        // UI element references
        this.elements = {};
        this.debounceDelay = 300;
        this.syncInterval = null;

        // Config
        this.mimeTypeMap = {
            'image/': 'images',
            'video/': 'videos',
            'audio/': 'audio',
            'application/pdf': 'documents',
            'text/': 'documents',
            'application/zip': 'archives',
            'application/x-rar-compressed': 'archives',
            'application/x-7z-compressed': 'archives',
            'text/x-python': 'code',
            'text/javascript': 'code',
            'text/html': 'code'
        };

        this.searchTimeout = null;
    }

    /**
     * Lifecycle: Called when window opens
     */
    onWindowOpen() {
        try {
            console.log('[FileManager] Window opened');
            this.ensureContainer();
            this.cacheFiles();
            this.loadFiles();
            this.render();
            this.attachEventListeners();
            this.startAutoSync();
        } catch (e) {
            console.error('[FileManager] Error on open:', e);
            this.showError('Failed to initialize file manager');
        }
    }

    /**
     * Lifecycle: Called when window closes
     */
    onWindowClose() {
        try {
            console.log('[FileManager] Window closed');
            this.detachEventListeners();
            this.stopAutoSync();
            this.saveState();
        } catch (e) {
            console.error('[FileManager] Error on close:', e);
        }
    }

    /**
     * Ensure container element exists in DOM
     */
    ensureContainer() {
        let container = document.getElementById(`${this.windowId}-content`);
        if (!container) {
            throw new Error(`Container #${this.windowId}-content not found`);
        }
        return container;
    }

    // ========================
    // STATE & STORAGE
    // ========================

    /**
     * Load files from backend /api/bridge?action=pull
     */
    async loadFiles() {
        try {
            this.state.isLoading = true;
            this.updateLoadingUI();

            const sessionID = window.System?.sessionID || 'default';
            const bridgeURL = window.System?.bridgeURL || '/api/bridge';
            const url = `${bridgeURL}?action=pull&sessionId=${sessionID}`;

            console.log(`[FileManager] Fetching from: ${url}`);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const fileData = await response.json();
            console.log(`[FileManager] Backend response:`, fileData);

            // Reset files first
            this.files = [];

            if (fileData === null) {
                // Empty backend - no files yet
                console.log(`[FileManager] Backend returned null (no files uploaded yet)`);
            } else if (Array.isArray(fileData) && fileData.length > 0) {
                // Convert backend objects to FileItem format
                this.files = fileData.map(f => new FileItem(f));
                console.log(`[FileManager] Loaded ${this.files.length} files from array`);
            } else if (Array.isArray(fileData) && fileData.length === 0) {
                console.log(`[FileManager] Backend returned empty array`);
            } else if (fileData && typeof fileData === 'object' && !Array.isArray(fileData)) {
                // Single file object or wrapped response
                if (fileData.files && Array.isArray(fileData.files)) {
                    // Response has files property
                    this.files = fileData.files.map(f => new FileItem(f));
                    console.log(`[FileManager] Loaded ${this.files.length} files from wrapped response`);
                } else if (fileData.id) {
                    // Single file object
                    this.files = [new FileItem(fileData)];
                    console.log(`[FileManager] Loaded 1 file (${fileData.name || 'unknown'})`);
                } else {
                    console.log(`[FileManager] Backend returned object but no files found:`, Object.keys(fileData));
                }
            } else {
                console.log(`[FileManager] Unexpected response type: ${typeof fileData}`);
            }

            // Apply filters and sort
            this.displayedFiles = this.applyFilters();
            this.cacheFiles();
            this.renderFileList();
            this.renderSidebar();
            this.updateStatusBar();

            console.log(`[FileManager] Total files available: ${this.files.length}`);
        } catch (e) {
            console.error('[FileManager] Load error:', e);
            this.showError('Failed to load files');
            this.files = [];
            this.displayedFiles = [];
            this.renderFileList();
        } finally {
            this.state.isLoading = false;
            this.updateLoadingUI();
        }
    }

    /**
     * Load files from cache if available
     */
    loadCachedFiles() {
        try {
            const cached = localStorage.getItem('dgc_fm_files');
            if (cached) {
                const data = JSON.parse(cached);
                this.files = data.map(f => new FileItem(f));
                this.displayedFiles = this.applyFilters();
                return true;
            }
        } catch (e) {
            console.warn('[FileManager] Cache load failed:', e);
        }
        return false;
    }

    /**
     * Cache files to localStorage
     */
    cacheFiles() {
        try {
            localStorage.setItem('dgc_fm_files', JSON.stringify(this.files));
            localStorage.setItem('dgc_fm_starred', JSON.stringify(Array.from(this.starred)));
            localStorage.setItem('dgc_fm_trash', JSON.stringify(this.trash));
        } catch (e) {
            console.warn('[FileManager] Cache save failed:', e);
        }
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem('dgc_fm_state', JSON.stringify({
                filterType: this.state.filterType,
                sortBy: this.state.sortBy,
                sortOrder: this.state.sortOrder,
                isGridView: this.state.isGridView
            }));
        } catch (e) {
            console.warn('[FileManager] State save failed:', e);
        }
    }

    // ========================
    // FILTERING & SORTING
    // ========================

    /**
     * Apply all active filters and return filtered array
     */
    applyFilters() {
        let filtered = [...this.files];

        // Category filter
        if (this.state.filterType !== 'all' && this.state.filterType !== 'trash') {
            filtered = filtered.filter(f => f.category === this.state.filterType);
        }

        // Starred filter
        if (this.state.filterType === 'starred') {
            filtered = filtered.filter(f => this.starred.has(f.id));
        }

        // Search filter
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(f => f.name.toLowerCase().includes(query));
        }

        // Sort
        filtered.sort((a, b) => {
            let aVal = a[this.state.sortBy];
            let bVal = b[this.state.sortBy];

            if (this.state.sortBy === 'size') {
                aVal = parseInt(aVal) || 0;
                bVal = parseInt(bVal) || 0;
            } else if (this.state.sortBy === 'date') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }

            if (this.state.sortOrder === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });

        return filtered;
    }

    /**
     * Set sort field and toggle sort order if same field clicked
     */
    setSortBy(field) {
        if (this.state.sortBy === field) {
            this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortBy = field;
            this.state.sortOrder = 'asc';
        }
        this.displayedFiles = this.applyFilters();
        this.renderFileList();
        this.saveState();
    }

    /**
     * Set filter type
     */
    setFilter(type) {
        this.state.filterType = type;
        this.displayedFiles = this.applyFilters();
        this.renderFileList();
        this.saveState();
    }

    /**
     * Search files (debounced)
     */
    search(query) {
        this.state.searchQuery = query.trim();
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.displayedFiles = this.applyFilters();
            this.renderFileList();
        }, this.debounceDelay);
    }

    // ========================
    // FILE OPERATIONS
    // ========================

    /**
     * Download single file
     */
    async downloadFile(fileId) {
        try {
            const file = this.getFileById(fileId);
            if (!file) {
                this.showError('File not found');
                return;
            }

            // Decode base64 to blob
            const binaryString = atob(file.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: file.mimeType });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification(`✓ Downloaded: ${file.name}`);
        } catch (e) {
            console.error('[FileManager] Download error:', e);
            this.showError('Failed to download file');
        }
    }

    /**
     * Download multiple files as ZIP
     */
    async downloadMultiple(fileIds) {
        // Note: Requires JSZip library in Phase 2
        // For MVP, just download files individually
        const count = fileIds.size;
        let downloaded = 0;

        for (const fileId of fileIds) {
            await this.downloadFile(fileId);
            downloaded++;
        }

        this.showNotification(`✓ Downloaded ${downloaded} files`);
    }

    /**
     * Delete file (soft delete to trash)
     */
    deleteFile(fileId) {
        try {
            const file = this.getFileById(fileId);
            if (!file) {
                this.showError('File not found');
                return;
            }

            // Move to trash
            file.deletedAt = new Date().toISOString();
            this.trash.push(file);
            this.files = this.files.filter(f => f.id !== fileId);

            // Update display
            this.removeFromDisplayedFiles(fileId);
            this.renderFileList();
            this.saveState();

            this.showNotification(`✓ Deleted: ${file.name}`);
        } catch (e) {
            console.error('[FileManager] Delete error:', e);
            this.showError('Failed to delete file');
        }
    }

    /**
     * Delete multiple files
     */
    deleteMultiple(fileIds) {
        const count = fileIds.size;
        for (const fileId of fileIds) {
            const file = this.getFileById(fileId);
            if (file) {
                file.deletedAt = new Date().toISOString();
                this.trash.push(file);
            }
        }

        this.files = this.files.filter(f => !fileIds.has(f.id));
        this.displayedFiles = this.displayedFiles.filter(f => !fileIds.has(f.id));
        this.state.selectedFileIds.clear();

        this.renderFileList();
        this.saveState();

        this.showNotification(`✓ Deleted ${count} files`);
    }

    /**
     * Permanently delete file (no recovery)
     */
    permanentlyDeleteFile(fileId) {
        if (!confirm('Permanently delete? This cannot be undone.')) return;

        try {
            this.trash = this.trash.filter(f => f.id !== fileId);
            this.saveState();
            this.renderFileList();
            this.showNotification('✓ Permanently deleted');
        } catch (e) {
            console.error('[FileManager] Permanent delete error:', e);
            this.showError('Failed to delete file');
        }
    }

    /**
     * Restore file from trash
     */
    restoreFromTrash(fileId) {
        try {
            const file = this.trash.find(f => f.id === fileId);
            if (!file) {
                this.showError('File not found in trash');
                return;
            }

            delete file.deletedAt;
            this.files.push(file);
            this.trash = this.trash.filter(f => f.id !== fileId);

            this.displayedFiles = this.applyFilters();
            this.renderFileList();
            this.saveState();

            this.showNotification(`✓ Restored: ${file.name}`);
        } catch (e) {
            console.error('[FileManager] Restore error:', e);
            this.showError('Failed to restore file');
        }
    }

    /**
     * Empty trash completely
     */
    emptyTrash() {
        const count = this.trash.length;
        if (!confirm(`Empty trash? ${count} files will be permanently deleted.`)) return;

        try {
            this.trash = [];
            this.saveState();
            this.renderFileList();
            this.showNotification(`✓ Emptied trash`);
        } catch (e) {
            console.error('[FileManager] Empty trash error:', e);
            this.showError('Failed to empty trash');
        }
    }

    /**
     * Cleanup expired trash (7 days)
     */
    cleanupExpiredTrash() {
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        this.trash = this.trash.filter(f => {
            if (!f.deletedAt) return true;
            const deletedTime = new Date(f.deletedAt).getTime();
            return (now - deletedTime) < sevenDaysMs;
        });

        this.saveState();
    }

    // ========================
    // SELECTION & METADATA
    // ========================

    /**
     * Select file
     */
    selectFile(fileId, clearPrevious = true) {
        if (clearPrevious) {
            this.state.selectedFileIds.clear();
        }
        this.state.selectedFileIds.add(fileId);
        this.renderFileList();
        this.renderPreview(fileId);
    }

    /**
     * Toggle select file
     */
    toggleSelectFile(fileId) {
        if (this.state.selectedFileIds.has(fileId)) {
            this.state.selectedFileIds.delete(fileId);
        } else {
            this.state.selectedFileIds.add(fileId);
        }
        this.renderFileList();
    }

    /**
     * Select all files
     */
    selectAll() {
        this.displayedFiles.forEach(file => {
            this.state.selectedFileIds.add(file.id);
        });
        this.renderFileList();
    }

    /**
     * Deselect all files
     */
    deselectAll() {
        this.state.selectedFileIds.clear();
        this.renderFileList();
    }

    /**
     * Toggle star for file
     */
    toggleStar(fileId) {
        const file = this.getFileById(fileId);
        if (!file) return;

        if (this.starred.has(fileId)) {
            this.starred.delete(fileId);
        } else {
            this.starred.add(fileId);
        }

        this.renderFileList();
        this.saveState();
    }

    /**
     * Rename file
     */
    renameFile(fileId, newName) {
        try {
            const file = this.getFileById(fileId);
            if (!file) {
                this.showError('File not found');
                return;
            }

            const oldName = file.name;
            file.name = newName;

            this.renderFileList();
            this.renderPreview(fileId);
            this.saveState();

            this.showNotification(`✓ Renamed: ${oldName} → ${newName}`);
        } catch (e) {
            console.error('[FileManager] Rename error:', e);
            this.showError('Failed to rename file');
        }
    }

    /**
     * Copy filename to clipboard
     */
    copyToClipboard(fileId) {
        const file = this.getFileById(fileId);
        if (!file) return;

        navigator.clipboard.writeText(file.name).then(() => {
            this.showNotification(`✓ Copied: ${file.name}`);
        }).catch(() => {
            this.showError('Failed to copy to clipboard');
        });
    }

    // ========================
    // UI RENDERING
    // ========================

    /**
     * Main render - build all UI
     */
    render() {
        try {
            console.log('[FileManager] Rendering...');
            const container = this.ensureContainer();

            container.innerHTML = `
        <div class="fm-container">
          <div class="fm-toolbar">
            <input type="text" id="fm-search" class="fm-search" placeholder="🔍 Search files..." />
            <select id="fm-filter" class="fm-filter">
              <option value="all">All Files</option>
              <option value="images">📸 Images</option>
              <option value="documents">📄 Documents</option>
              <option value="videos">🎬 Videos</option>
              <option value="audio">🎵 Audio</option>
              <option value="archives">📦 Archives</option>
              <option value="code">💻 Code</option>
              <option value="starred">⭐ Starred</option>
              <option value="trash">🗑️ Trash</option>
            </select>
            <select id="fm-sort" class="fm-sort">
              <option value="date">Sort: Date</option>
              <option value="name">Sort: Name</option>
              <option value="size">Sort: Size</option>
              <option value="type">Sort: Type</option>
            </select>
            <button id="fm-view-toggle" class="fm-view-toggle" title="Toggle view">⊞</button>
          </div>

          <div class="fm-breadcrumb" id="fm-breadcrumb"></div>

          <div class="fm-main">
            <div class="fm-sidebar" id="fm-sidebar"></div>
            <div class="fm-content">
              <div class="fm-file-list" id="fm-file-list"></div>
              <div class="fm-preview" id="fm-preview"></div>
            </div>
          </div>

          <div class="fm-statusbar" id="fm-statusbar"></div>
        </div>
      `;

            // Store element references
            this.elements = {
                container: container.querySelector('.fm-container'),
                search: document.getElementById('fm-search'),
                filter: document.getElementById('fm-filter'),
                sort: document.getElementById('fm-sort'),
                viewToggle: document.getElementById('fm-view-toggle'),
                breadcrumb: document.getElementById('fm-breadcrumb'),
                sidebar: document.getElementById('fm-sidebar'),
                fileList: document.getElementById('fm-file-list'),
                preview: document.getElementById('fm-preview'),
                statusbar: document.getElementById('fm-statusbar')
            };

            // Add styles
            this.injectStyles();

            // Render sections
            this.renderSidebar();
            this.renderBreadcrumb();
            this.renderFileList();
            this.updateStatusBar();
        } catch (e) {
            console.error('[FileManager] Render error:', e);
            this.showError('Failed to render file manager');
        }
    }

    /**
     * Render sidebar categories
     */
    renderSidebar() {
        const sidebar = this.elements.sidebar;
        if (!sidebar) return;

        const categoryCounts = {
            all: this.files.length,
            images: this.files.filter(f => f.category === 'images').length,
            documents: this.files.filter(f => f.category === 'documents').length,
            videos: this.files.filter(f => f.category === 'videos').length,
            audio: this.files.filter(f => f.category === 'audio').length,
            archives: this.files.filter(f => f.category === 'archives').length,
            code: this.files.filter(f => f.category === 'code').length,
            starred: this.starred.size,
            trash: this.trash.length
        };

        let html = `<div class="fm-sidebar-section">
      <div class="fm-sidebar-title">LOCATIONS</div>
      ${this.renderSidebarItem('📥 All Files', 'all', categoryCounts.all)}
      ${this.renderSidebarItem('📸 Images', 'images', categoryCounts.images)}
      ${this.renderSidebarItem('📄 Documents', 'documents', categoryCounts.documents)}
      ${this.renderSidebarItem('🎬 Videos', 'videos', categoryCounts.videos)}
      ${this.renderSidebarItem('🎵 Audio', 'audio', categoryCounts.audio)}
      ${this.renderSidebarItem('📦 Archives', 'archives', categoryCounts.archives)}
      ${this.renderSidebarItem('💻 Code', 'code', categoryCounts.code)}
    </div>
    <div class="fm-sidebar-section">
      <div class="fm-sidebar-title">SPECIAL</div>
      ${this.renderSidebarItem('⭐ Starred', 'starred', categoryCounts.starred)}
      ${this.renderSidebarItem('🗑️ Trash', 'trash', categoryCounts.trash)}
    </div>`;

        sidebar.innerHTML = html;
    }

    /**
     * Render single sidebar item
     */
    renderSidebarItem(label, filter, count = null) {
        const isActive = this.state.filterType === filter;
        const countStr = count !== null ? ` <span class="fm-count">${count}</span>` : '';
        const className = `fm-sidebar-item ${isActive ? 'active' : ''}`;

        return `<div class="${className}" onclick="window.fileManager.setFilter('${filter}')">
      ${label}${countStr}
    </div>`;
    }

    /**
     * Render breadcrumb navigation
     */
    renderBreadcrumb() {
        const breadcrumb = this.elements.breadcrumb;
        if (!breadcrumb) return;

        let html = `<div class="fm-breadcrumb-item">🏠</div>
    <div class="fm-breadcrumb-separator">/</div>
    <div class="fm-breadcrumb-item">${this.state.currentPath}</div>`;

        breadcrumb.innerHTML = html;
    }

    /**
     * Render file list (grid or list)
     */
    renderFileList() {
        const fileList = this.elements.fileList;
        if (!fileList) return;

        if (this.displayedFiles.length === 0) {
            fileList.innerHTML = '<div class="fm-empty">📭 No files found</div>';
            return;
        }

        const viewClass = this.state.isGridView ? 'grid' : 'list';
        const html = this.displayedFiles.map(file => {
            const isSelected = this.state.selectedFileIds.has(file.id);
            const isStarred = this.starred.has(file.id);

            if (this.state.isGridView) {
                return `
          <div class="fm-file-item grid ${isSelected ? 'selected' : ''}"
               onclick="window.fileManager.selectFile('${file.id}')"
               ondblclick="window.fileManager.downloadFile('${file.id}')">
            <div class="fm-file-icon">${file.icon}</div>
            <div class="fm-file-name" title="${file.name}">${file.name}</div>
            <div class="fm-file-meta">${file.size}</div>
            <div class="fm-file-date">${new Date(file.date).toLocaleDateString()}</div>
            <div class="fm-file-actions">
              <button onclick="event.stopPropagation(); window.fileManager.toggleStar('${file.id}')" class="fm-star ${isStarred ? 'active' : ''}">⭐</button>
              <button onclick="event.stopPropagation(); window.fileManager.downloadFile('${file.id}')" class="fm-action">⬇️</button>
              <button onclick="event.stopPropagation(); window.fileManager.deleteFile('${file.id}')" class="fm-action">🗑️</button>
            </div>
          </div>
        `;
            } else {
                return `
          <div class="fm-file-item list ${isSelected ? 'selected' : ''}"
               onclick="window.fileManager.selectFile('${file.id}')">
            <div class="fm-file-icon">${file.icon}</div>
            <div class="fm-file-name">${file.name}</div>
            <div class="fm-file-size">${file.size}</div>
            <div class="fm-file-type">${file.mimeType}</div>
            <div class="fm-file-date">${new Date(file.date).toLocaleString()}</div>
            <div class="fm-file-menu">
              <button onclick="event.stopPropagation(); window.fileManager.showContextMenu(event, '${file.id}')" class="fm-menu-btn">⋯</button>
            </div>
          </div>
        `;
            }
        }).join('');

        fileList.innerHTML = html;
    }

    /**
     * Render preview panel
     */
    renderPreview(fileId) {
        const preview = this.elements.preview;
        if (!preview) return;

        const file = this.getFileById(fileId);
        if (!file) {
            preview.innerHTML = '<div class="fm-preview-empty">Select a file to preview</div>';
            return;
        }

        let previewContent = '';
        if (file.mimeType.startsWith('image/')) {
            previewContent = `<img src="data:${file.mimeType};base64,${file.data}" class="fm-preview-image" />`;
        } else {
            previewContent = `<div class="fm-preview-placeholder">${file.icon} ${file.mimeType}</div>`;
        }

        const previewHTML = `
      <div class="fm-preview-header">${file.name}</div>
      <div class="fm-preview-content">
        ${previewContent}
      </div>
      <div class="fm-preview-meta">
        <div><strong>Type:</strong> ${file.mimeType}</div>
        <div><strong>Size:</strong> ${file.size}</div>
        <div><strong>Date:</strong> ${new Date(file.date).toLocaleString()}</div>
      </div>
      <div class="fm-preview-actions">
        <button onclick="window.fileManager.downloadFile('${file.id}')" class="fm-btn-primary">⬇️ Download</button>
        <button onclick="window.fileManager.deleteFile('${file.id}')" class="fm-btn-secondary">🗑️ Delete</button>
        <button onclick="window.fileManager.toggleStar('${file.id}')" class="fm-btn-secondary">⭐ Star</button>
      </div>
    `;

        preview.innerHTML = previewHTML;
    }

    /**
     * Update status bar
     */
    updateStatusBar() {
        const selected = this.state.selectedFileIds.size;
        const total = this.files.length;
        const status = `${this.displayedFiles.length} files • ${selected} selected • (${total} total)`;
        if (this.elements.statusbar) {
            this.elements.statusbar.textContent = status;
        }
    }

    // ========================
    // EVENTS
    // ========================

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Search
        if (this.elements.search) {
            this.elements.search.addEventListener('input', (e) => {
                this.search(e.target.value);
            });
        }

        // Filter
        if (this.elements.filter) {
            this.elements.filter.addEventListener('change', (e) => {
                this.setFilter(e.target.value);
            });
        }

        // Sort
        if (this.elements.sort) {
            this.elements.sort.addEventListener('change', (e) => {
                this.setSortBy(e.target.value);
            });
        }

        // View toggle
        if (this.elements.viewToggle) {
            this.elements.viewToggle.addEventListener('click', () => {
                this.state.isGridView = !this.state.isGridView;
                this.elements.viewToggle.textContent = this.state.isGridView ? '⊞' : '≡';
                this.renderFileList();
                this.saveState();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Drag and drop
        if (this.elements.fileList) {
            this.elements.fileList.addEventListener('dragover', (e) => e.preventDefault());
            this.elements.fileList.addEventListener('drop', (e) => this.handleDrop(e));
        }
    }

    /**
     * Keyboard shortcuts
     */
    handleKeydown(event) {
        if (event.ctrlKey || event.metaKey) {
            if (event.key === 'a') {
                event.preventDefault();
                this.selectAll();
            } else if (event.key === 'd') {
                event.preventDefault();
                if (this.state.selectedFileIds.size > 0) {
                    this.downloadMultiple(this.state.selectedFileIds);
                }
            }
        }

        if (event.key === 'Delete' && this.state.selectedFileIds.size > 0) {
            this.deleteMultiple(this.state.selectedFileIds);
        }

        if (event.key === 'Escape') {
            this.deselectAll();
        }
    }

    /**
     * Context menu (right-click)
     */
    showContextMenu(event, fileId) {
        event.preventDefault();
        event.stopPropagation();

        const file = this.getFileById(fileId);
        if (!file) return;

        const menu = document.createElement('div');
        menu.className = 'fm-context-menu';
        menu.style.cssText = `position: fixed; top: ${event.clientY}px; left: ${event.clientX}px; z-index: 10000;`;
        menu.innerHTML = `
      <div class="fm-context-item" onclick="window.fileManager.downloadFile('${file.id}')">⬇️ Download</div>
      <div class="fm-context-item" onclick="window.fileManager.toggleStar('${file.id}')">⭐ Star</div>
      <div class="fm-context-item" onclick="window.fileManager.copyToClipboard('${file.id}')">📋 Copy Name</div>
      <div class="fm-context-item" onclick="window.fileManager.renameFile('${file.id}', prompt('New name:', '${file.name}'))">✏️ Rename</div>
      <div class="fm-context-item" onclick="window.fileManager.deleteFile('${file.id}')">🗑️ Delete</div>
    `;

        document.body.appendChild(menu);

        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    // ========================
    // AUTO-SYNC & POLLING
    // ========================

    /**
     * Start auto-sync polling
     */
    startAutoSync() {
        // Report status to backend immediately and every 5 seconds
        this.syncStatus();
        
        this.syncInterval = setInterval(() => {
            this.pollNewFiles();
            this.syncStatus(); // Report desktop is online
        }, 5000); // Every 5 seconds
    }

    /**
     * Report desktop status to backend (heartbeat for mobile to detect)
     */
    async syncStatus() {
        try {
            const sessionID = window.System?.sessionID || 'default';
            const bridgeURL = window.System?.bridgeURL || '/api/bridge';
            const url = `${bridgeURL}?action=sync&sessionId=${sessionID}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    windowOpen: true,
                    fileCount: this.files.length,
                    timestamp: Date.now()
                })
            });

            if (response.ok) {
                console.log('[FileManager] Status synced with backend');
            }
        } catch (e) {
            console.warn('[FileManager] Sync status error:', e.message);
        }
    }

    /**
     * Stop auto-sync
     */
    stopAutoSync() {
        clearInterval(this.syncInterval);
    }

    /**
     * Poll for new files from backend
     */
    async pollNewFiles() {
        try {
            const sessionID = window.System?.sessionID || 'default';
            const bridgeURL = window.System?.bridgeURL || '/api/bridge';
            const url = `${bridgeURL}?action=pull&sessionId=${sessionID}`;

            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`[FileManager] Poll failed: HTTP ${response.status}`);
                return;
            }

            const fileData = await response.json();
            if (!fileData) {
                console.log(`[FileManager] Poll: No files from backend`);
                return;
            }

            // Parse response - handle both array and single object
            let newFiles = [];
            if (Array.isArray(fileData)) {
                newFiles = fileData;
            } else if (fileData.files && Array.isArray(fileData.files)) {
                newFiles = fileData.files;
            } else if (fileData.id) {
                newFiles = [fileData];
            }

            if (newFiles.length === 0) {
                console.log(`[FileManager] Poll: Empty response`);
                return;
            }

            const existingIds = this.files.map(f => f.id);
            let newCount = 0;

            for (const newFileData of newFiles) {
                if (!existingIds.includes(newFileData.id)) {
                    const newFile = new FileItem(newFileData);
                    this.files.push(newFile);
                    newCount++;
                    this.showNotification(`📁 New file: ${newFile.name}`);
                }
            }

            if (newCount > 0) {
                console.log(`[FileManager] Poll: Found ${newCount} new files`);
                this.displayedFiles = this.applyFilters();
                this.renderFileList();
                this.renderSidebar();
                this.updateStatusBar();
                this.cacheFiles();
            }
        } catch (e) {
            console.warn('[FileManager] Poll error:', e.message);
        }

        // Cleanup trash regardless
        this.cleanupExpiredTrash();
    }

    // ========================
    // HELPERS
    // ========================

    /**
     * Get file by ID
     */
    getFileById(fileId) {
        return this.files.find(f => f.id === fileId) ||
            this.trash.find(f => f.id === fileId);
    }

    /**
     * Remove file from displayed list
     */
    removeFromDisplayedFiles(fileId) {
        this.displayedFiles = this.displayedFiles.filter(f => f.id !== fileId);
    }

    /**
     * Navigate to path
     */
    navigateTo(path) {
        this.state.currentPath = path;
        this.renderBreadcrumb();
    }

    /**
     * Show notification toast
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fm-notification';
        notification.textContent = message;
        notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #2ecc71;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10001;
      animation: slideIn 0.3s ease;
    `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Show error message
     */
    showError(message) {
        const error = document.createElement('div');
        error.className = 'fm-error';
        error.textContent = `❌ ${message}`;
        error.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10001;
    `;

        document.body.appendChild(error);
        setTimeout(() => error.remove(), 5000);
    }

    /**
     * Update loading UI state
     */
    updateLoadingUI() {
        if (this.state.isLoading && this.elements.fileList) {
            this.elements.fileList.innerHTML = '<div class="fm-loading">Loading files...</div>';
        }
    }

    /**
     * Detach all event listeners
     */
    detachEventListeners() {
        if (this.elements.search) {
            this.elements.search.removeEventListener('input', null);
        }
        document.removeEventListener('keydown', (e) => this.handleKeydown(e));
    }

    /**
     * Inject styles into page
     */
    injectStyles() {
        if (document.getElementById('fm-styles')) return; // Already injected

        const style = document.createElement('style');
        style.id = 'fm-styles';
        style.textContent = `
      .fm-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #f5f5f5;
        color: #333;
        font-family: inherit;
      }

      .fm-toolbar {
        display: flex;
        gap: 8px;
        padding: 12px;
        background: #fff;
        border-bottom: 1px solid #e0e0e0;
        flex-wrap: wrap;
      }

      .fm-search {
        flex: 1;
        min-width: 200px;
        padding: 6px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }

      .fm-filter, .fm-sort {
        padding: 6px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        background: #fff;
      }

      .fm-view-toggle {
        padding: 6px 12px;
        background: #00d4ff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }

      .fm-breadcrumb {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background: #fafafa;
        border-bottom: 1px solid #e0e0e0;
        font-size: 13px;
      }

      .fm-breadcrumb-item {
        cursor: pointer;
        padding: 0 4px;
      }

      .fm-breadcrumb-item:hover {
        text-decoration: underline;
      }

      .fm-breadcrumb-separator {
        margin: 0 4px;
        color: #999;
      }

      .fm-main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .fm-sidebar {
        width: 180px;
        background: #fff;
        border-right: 1px solid #e0e0e0;
        overflow-y: auto;
        padding: 8px 0;
      }

      .fm-sidebar-section {
        margin-bottom: 16px;
      }

      .fm-sidebar-title {
        padding: 8px 12px;
        font-weight: bold;
        font-size: 12px;
        color: #999;
        text-transform: uppercase;
      }

      .fm-sidebar-item {
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-left: 3px solid transparent;
      }

      .fm-sidebar-item:hover {
        background: #f5f5f5;
      }

      .fm-sidebar-item.active {
        background: #e8f4f8;
        border-left-color: #00d4ff;
        font-weight: bold;
      }

      .fm-count {
        font-size: 12px;
        color: #999;
      }

      .fm-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .fm-file-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
      }

      .fm-file-list.list {
        display: flex;
        flex-direction: column;
        grid-template-columns: none;
      }

      .fm-file-item {
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .fm-file-item:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-color: #00d4ff;
      }

      .fm-file-item.selected {
        background: #e8f4f8;
        border-color: #00d4ff;
      }

      .fm-file-item.grid {
        align-items: center;
        text-align: center;
      }

      .fm-file-item.list {
        flex-direction: row;
        align-items: center;
        padding: 8px 12px;
      }

      .fm-file-icon {
        font-size: 24px;
      }

      .fm-file-item.list .fm-file-icon {
        font-size: 18px;
        margin-right: 8px;
      }

      .fm-file-name {
        font-weight: 500;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }

      .fm-file-meta {
        font-size: 11px;
        color: #999;
      }

      .fm-file-date {
        font-size: 11px;
        color: #999;
      }

      .fm-file-item.list .fm-file-meta {
        margin: 0 12px;
      }

      .fm-file-item.list .fm-file-date {
        margin: 0 12px;
      }

      .fm-file-actions {
        display: none;
        gap: 4px;
      }

      .fm-file-item:hover .fm-file-actions {
        display: flex;
      }

      .fm-action, .fm-star {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        padding: 2px 4px;
      }

      .fm-action:hover {
        opacity: 0.7;
      }

      .fm-star.active {
        color: gold;
      }

      .fm-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #999;
        font-size: 16px;
      }

      .fm-loading {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #999;
      }

      .fm-preview {
        width: 280px;
        background: #fff;
        border-left: 1px solid #e0e0e0;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .fm-preview-header {
        font-weight: bold;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .fm-preview-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 4px;
        overflow: hidden;
      }

      .fm-preview-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .fm-preview-placeholder {
        text-align: center;
        color: #999;
        font-size: 24px;
      }

      .fm-preview-meta {
        font-size: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .fm-preview-meta div {
        display: flex;
        gap: 8px;
      }

      .fm-preview-actions {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .fm-btn-primary {
        padding: 8px 12px;
        background: #00d4ff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }

      .fm-btn-primary:hover {
        opacity: 0.9;
      }

      .fm-btn-secondary {
        padding: 8px 12px;
        background: #f0f0f0;
        color: #333;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .fm-btn-secondary:hover {
        background: #e0e0e0;
      }

      .fm-preview-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #999;
      }

      .fm-statusbar {
        padding: 8px 12px;
        background: #fafafa;
        border-top: 1px solid #e0e0e0;
        font-size: 12px;
        color: #999;
      }

      .fm-context-menu {
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        overflow: hidden;
      }

      .fm-context-item {
        padding: 8px 12px;
        cursor: pointer;
        font-size: 13px;
      }

      .fm-context-item:hover {
        background: #f0f0f0;
      }

      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }

      @media (max-width: 768px) {
        .fm-main {
          flex-direction: column;
        }

        .fm-sidebar {
          width: 100%;
          height: auto;
          border-right: none;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          gap: 16px;
        }

        .fm-preview {
          width: 100%;
          border-left: none;
          border-top: 1px solid #e0e0e0;
          max-height: 200px;
        }
      }
    `;

        document.head.appendChild(style);
    }
}

/**
 * File Item Model - represents a single file
 */
class FileItem {
    constructor(data) {
        this.id = data.id || `file_${Date.now()}_${Math.random()}`;
        this.name = data.name || 'Unknown';
        this.mimeType = data.mimeType || 'application/octet-stream';
        this.size = this.formatFileSize(data.size || 0);
        this.sizeBytes = data.size || 0;
        this.date = data.date || new Date().toISOString();
        this.data = data.data || ''; // Base64 encoded file content
        this.category = this.categorizeFile(data.mimeType);
        this.icon = this.getIcon(this.category);
    }

    /**
     * Categorize file by MIME type
     */
    categorizeFile(mimeType) {
        if (mimeType.startsWith('image/')) return 'images';
        if (mimeType.startsWith('video/')) return 'videos';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('sheet')) return 'documents';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar')) return 'archives';
        if (mimeType.includes('python') || mimeType.includes('javascript') || mimeType.includes('html') || mimeType.includes('code')) return 'code';
        return 'other';
    }

    /**
     * Get icon for category
     */
    getIcon(category) {
        const icons = {
            images: '📸',
            videos: '🎬',
            audio: '🎵',
            documents: '📄',
            archives: '📦',
            code: '💻',
            other: '📋'
        };
        return icons[category] || '📋';
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
    }
}
