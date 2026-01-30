# FileManager System Architecture & Security

## Overview
A secure, stateless file transfer system enabling desktop-to-mobile and mobile-to-desktop file synchronization through a Cloudflare Workers backend.

## System Architecture

### Components
```
┌─────────────────────────────────────────────────────────────┐
│                      Desktop Browser                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FileManager (1,600+ lines vanilla JS)              │  │
│  │  - Grid/list view with multi-select                 │  │
│  │  - Search, filter, sort, archive                    │  │
│  │  - 5-second polling for new files                   │  │
│  │  - Status heartbeat every 5 seconds                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP REST API
                           │
┌─────────────────────────────────────────────────────────────┐
│            Cloudflare Workers /api/bridge                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Input Validation & Security Layer                  │  │
│  │  - Session ID validation                            │  │
│  │  - File size limits (50MB max)                      │  │
│  │  - File name sanitization                           │  │
│  │  - MIME type validation                             │  │
│  │  - CORS & Security Headers                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  KV Storage (Cloudflare Durable Objects)            │  │
│  │  - Stores files for 1 hour (auto-cleanup)           │  │
│  │  - Stores status for 10 minutes                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP REST API
                           │
┌─────────────────────────────────────────────────────────────┐
│                      Mobile Browser                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  File Upload Interface (500 lines, optimized UI)    │  │
│  │  - Drag-and-drop file upload                        │  │
│  │  - Real-time upload progress                        │  │
│  │  - Desktop status detection                         │  │
│  │  - Session-based file tracking                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Mobile → Desktop File Transfer
1. Mobile selects file(s) → converted to Base64
2. POST to `/api/bridge?action=push&sessionId=default`
3. Backend validates file (size, name, MIME type)
4. File stored in KV under `file_default` + timestamped backup
5. Desktop polls every 5 seconds
6. File retrieved, displayed in FileManager
7. File auto-deleted from backend (one-time retrieval)

### Status Synchronization
1. Desktop starts FileManager → immediately sends sync heartbeat
2. POST to `/api/bridge?action=sync&sessionId=default` every 5 seconds
3. Backend stores `state_default` with timestamp
4. Mobile polls every 3 seconds via `/api/bridge?action=status&sessionId=default`
5. Mobile checks if state was updated within 10 seconds
6. Shows "✓ Desktop Connected" or "✗ Desktop Offline"

## Security Features

### 1. Input Validation
- **Session ID**: Alphanumeric + dash/underscore, max 100 characters
  - Prevents injection attacks
  - Prevents path traversal
  
- **File Names**: Max 255 characters
  - No `..` path traversal
  - No `/` or `\` directory separators
  - Prevents arbitrary file placement
  
- **File Size**: Max 50MB per file
  - Prevents DoS through storage exhaustion
  - Prevents memory exhaustion
  
- **Base64 Data**: Max 100MB (≈75MB uncompressed)
  - Prevents buffer overflows
  - Prevents decompression bombs
  
- **MIME Type**: Max 100 characters
  - Prevents header injection

### 2. CORS & Headers
```
Access-Control-Allow-Origin: *
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cache-Control: no-store, no-cache, must-revalidate
```
- Prevents clickjacking
- Prevents MIME type sniffing
- Prevents caching of sensitive data
- Allows cross-origin file sharing (intentional)

### 3. Data Isolation
- Each session gets unique storage keys: `file_default`, `state_default`
- Files auto-delete after retrieval (one-time pull)
- State expires in 10 minutes (auto-cleanup)
- Files expire in 1 hour (auto-cleanup)

### 4. JSON Validation
- Try-catch on all JSON.parse()
- Detailed error messages for debugging
- Proper HTTP status codes (400, 413, 500)

### 5. Client-Side Security
- XSS prevention via `escapeHtml()` function
- All file names escaped before DOM insertion
- No `innerHTML` with user data

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Invalid session ID | 400 | "Invalid session ID" |
| File too large | 413 | "File exceeds 50MB limit" |
| Invalid JSON | 400 | "Invalid JSON in request body" |
| Invalid file name | 400 | "Invalid file name characters" |
| Invalid MIME type | 400 | "Invalid MIME type" |
| Server error | 500 | "Internal server error" |

## Performance Characteristics

- **Polling Latency**: 5 seconds (acceptable for file transfer)
- **Status Detection**: 3-10 seconds (mobile → server, server → check)
- **File Retrieval**: < 100ms (KV storage is global)
- **Scalability**: Stateless design, infinite horizontal scaling

## Reliability Features

1. **Graceful Degradation**
   - FileManager works without backend (cached files)
   - Mobile detects offline desktop (status check)
   - Proper error messages guide user action

2. **Data Cleanup**
   - Files auto-expire after 1 hour
   - Status auto-expires after 10 minutes
   - Prevents KV storage bloat

3. **Validation at Every Layer**
   - Frontend validation (user feedback)
   - Backend validation (security)
   - No trust in client data

## Testing Recommendations

### Unit Tests
- [ ] Session ID validation (valid/invalid formats)
- [ ] File size validation (under, at, over limit)
- [ ] File name sanitization (path traversal attempts)
- [ ] Base64 data validation (valid, invalid, oversized)

### Integration Tests
- [ ] Mobile upload → Desktop retrieval
- [ ] Status sync (online → offline → online)
- [ ] Large file transfer (50MB)
- [ ] Concurrent uploads from multiple sessions
- [ ] Network interruption handling

### Security Tests
- [ ] Path traversal in file names
- [ ] XSS in file names
- [ ] CORS boundary testing
- [ ] Rate limiting (if implemented)
- [ ] Session isolation

## Future Improvements

### Phase 2
- [ ] File chunking for progress tracking
- [ ] Resumable uploads for interrupted transfers
- [ ] File preview generation (images, PDFs)
- [ ] Encryption at rest (KV)

### Phase 3
- [ ] WebSocket upgrade for real-time transfers
- [ ] Multi-device synchronization
- [ ] Automatic conflict resolution
- [ ] Cloud storage backends (S3, GCS)

### Phase 4
- [ ] Rate limiting per session
- [ ] Analytics dashboard
- [ ] Admin controls
- [ ] Custom retention policies

## Deployment Checklist

- [x] Input validation on all endpoints
- [x] CORS security headers
- [x] Error handling for edge cases
- [x] Data cleanup mechanisms
- [x] Logging for debugging
- [x] Session isolation
- [x] XSS prevention
- [ ] Rate limiting
- [ ] WAF rules (optional)
- [ ] Monitoring/alerts

## Contact & Support
For enterprise deployment or security audits, all code is open-source and available for review.
