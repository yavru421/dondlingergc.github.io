# FileManager Quick Start Guide

## For End Users

### Desktop Setup
1. Open https://dondlingergc.com in your browser
2. Click the "File Manager" window in the taskbar
3. FileManager automatically connects to the backend

### Mobile Setup
1. Click the **"📱 Mobile"** button in FileManager
2. Scan the **QR code** with your phone
3. You're directed to a mobile file upload interface
4. Desktop status shows as **"✓ Desktop Connected"**
5. Upload files by:
   - Clicking the browse button
   - Dragging & dropping files
6. Files appear in FileManager instantly

### Desktop File Management
- **Grid/List View**: Toggle with buttons in top-right
- **Search**: Type to filter files by name
- **Categories**: Click sidebar to filter by file type
- **Multi-Select**: Hold Ctrl/Cmd and click files
- **Download**: Right-click or hover → Download
- **Delete**: Select files → Delete button (moves to trash)
- **Sort**: Click column headers

---

## For Developers

### Architecture
See [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for complete technical details.

### Local Testing

#### Option 1: Using Mock Server
```bash
# Terminal 1: Start mock bridge server
node mock-bridge.js
# Runs on http://localhost:8787/api/bridge

# Terminal 2: Serve static files
# Use any static server, e.g., Python 3:
python -m http.server 8000
# Open http://localhost:8000/index.html
```

#### Option 2: Using Production Backend
Just open https://dondlingergc.com - it uses Cloudflare Workers backend directly.

### Code Structure
```
├── index.html                    # Desktop app shell
├── js/file-manager.js           # 1,600+ lines FileManager class
├── mobilestatic/files.html      # Mobile upload interface
├── functions/api/bridge.js      # Cloudflare Workers backend
├── mock-bridge.js               # Local testing server
└── SYSTEM_ARCHITECTURE.md       # This file
```

### API Endpoints

#### GET /api/bridge?action=pull&sessionId=default
Retrieve uploaded files.
```javascript
Response: { id, name, size, data: "base64...", mimeType, timestamp }
// File is deleted after retrieval (one-time pull)
```

#### POST /api/bridge?action=push&sessionId=default
Upload a file.
```javascript
Body: {
  type: "file_upload",
  file: {
    name: "document.pdf",
    size: 12345,
    data: "base64...",
    mimeType: "application/pdf"
  }
}
Response: { success: true, id: 1234567890 }
```

#### POST /api/bridge?action=sync&sessionId=default
Report desktop is online (heartbeat).
```javascript
Body: { windowOpen: true, fileCount: 5, timestamp: 1234567890 }
Response: { success: true }
```

#### GET /api/bridge?action=status&sessionId=default
Check if desktop is online (from mobile).
```javascript
Response: { online: true, state: {...}, lastSeen: 1234567890 }
```

### Security Notes
- All inputs are validated server-side
- Session IDs are isolated (default, custom, etc.)
- Files auto-delete after 1 hour (backend cleanup)
- Status auto-expires after 10 minutes
- Max file size: 50MB
- No authentication required (session-based)

### Performance
- Backend: Cloudflare Workers (global edge network)
- Latency: ~5-10 seconds for file sync
- Storage: KV with 1-hour TTL (auto-cleanup)
- Stateless design: scales infinitely

### Debugging
1. Open browser DevTools (F12)
2. Check Console for `[FileManager]` logs
3. Mobile logs available at `dondlingergc.com/mobilestatic/files.html` in console
4. All HTTP requests logged to browser Network tab

### Common Issues

**Desktop shows "No files found"**
- Ensure mobile has uploaded a file
- Check DevTools Console for `[FileManager] Loaded 0 files`
- Reload page to force sync

**Mobile says "Desktop Offline"**
- Desktop needs FileManager window open
- FileManager sends status every 5 seconds
- Wait 10 seconds for status to timeout
- Check if mobile can reach /api/bridge (network tab)

**File upload fails on mobile**
- Maximum size is 50MB
- Check file name (no special characters allowed)
- Check MIME type is valid
- Look at Network tab for error details

---

## For Enterprises

### Security Audit Available
All code is public and reviewed for:
- Input validation ✓
- XSS prevention ✓
- CORS security ✓
- Session isolation ✓
- Error handling ✓
- Data cleanup ✓

### Deployment Options
- **Public**: https://dondlingergc.com (production)
- **Private**: Deploy to your own Cloudflare Workers
- **Custom**: Fork and modify for your needs

### Support
For security questions or enterprise deployment, review [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).
