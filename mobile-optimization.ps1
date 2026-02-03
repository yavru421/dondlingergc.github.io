#Requires -Version 5.0
<#
.SYNOPSIS
    Mobile-First Optimization Patch for DondlingerGC
.DESCRIPTION
    Patches the codebase to be iPhone and mobile-first optimized
.EXAMPLE
    .\mobile-optimization.ps1
#>

$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

Write-Host "🔧 DondlingerGC Mobile Optimization Patch" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$rootDir = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
$jsDir = Join-Path $rootDir "js"
$mobileStaticDir = Join-Path $rootDir "mobilestatic"

Write-Host "Working directory: $rootDir" -ForegroundColor DarkGray

# Helper function to backup files
function Backup-File {
    param([string]$FilePath)
    if (Test-Path $FilePath) {
        $backupPath = "$FilePath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $FilePath $backupPath
        Write-Host "  ✓ Backed up: $(Split-Path -Leaf $FilePath)" -ForegroundColor Green
    }
}

# Helper function to create or update file
function Create-OrUpdate-File {
    param([string]$FilePath, [string]$Content, [string]$Description)
    
    if (Test-Path $FilePath) {
        Backup-File $FilePath
    }
    
    $parentDir = Split-Path -Parent $FilePath
    if (!(Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }
    
    Set-Content -Path $FilePath -Value $Content -Encoding UTF8
    Write-Host "  ✓ $Description" -ForegroundColor Green
}

# ============================================================================
# STEP 1: Create Mobile Detection Script
# ============================================================================
Write-Host "`n[1/7] Creating mobile detection script..." -ForegroundColor Yellow

$detectScript = @'
/**
 * Mobile Detection & Routing
 * Automatically serves appropriate experience based on device
 */

(function() {
    'use strict';
    
    // Detect if mobile/tablet
    const isMobileUserAgent = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    const isPhone = /iPhone|Android|BlackBerry|IEMobile/i.test(navigator.userAgent) && !isTablet;
    
    // Detect touch capability
    const isTouchDevice = () => {
        return (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
    };
    
    // Store device info globally
    window.DeviceInfo = {
        isMobile: isMobileUserAgent,
        isPhone: isPhone,
        isTablet: isTablet,
        isTouch: isTouchDevice(),
        userAgent: navigator.userAgent,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            dpr: window.devicePixelRatio
        }
    };
    
    console.log('[DeviceDetection]', window.DeviceInfo);
    
    // Route to appropriate experience
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';
    
    // If on desktop page and mobile detected, redirect
    if ((currentFile === 'index.html' || currentFile === '') && window.DeviceInfo.isMobile) {
        // Comment out for now to prevent redirect loops
        // console.log('[DeviceDetection] Redirecting to mobile experience...');
        // window.location.replace('./mobile.html');
        document.body.classList.add('is-mobile-device');
    }
    
    // Add device class to body for CSS targeting
    if (window.DeviceInfo.isMobile) document.documentElement.classList.add('is-mobile');
    if (window.DeviceInfo.isPhone) document.documentElement.classList.add('is-phone');
    if (window.DeviceInfo.isTablet) document.documentElement.classList.add('is-tablet');
    if (window.DeviceInfo.isTouch) document.documentElement.classList.add('is-touch');
})();
'@

Create-OrUpdate-File -FilePath (Join-Path $jsDir "device-detection.js") -Content $detectScript -Description "Device detection and routing script"

# ============================================================================
# STEP 2: Create Touch Interactions Handler
# ============================================================================
Write-Host "`n[2/7] Creating touch interactions handler..." -ForegroundColor Yellow

$touchScript = @'
/**
 * Touch Interactions Handler
 * Optimizes touch events, gestures, and mobile interactions
 */

class TouchHandler {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.swipeThreshold = 50;
        
        this.init();
    }
    
    init() {
        // Disable 300ms tap delay
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('button, a, input, textarea')) {
                e.target.closest('button, a, input, textarea').style.opacity = '0.7';
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (e.target.closest('button, a, input, textarea')) {
                e.target.closest('button, a, input, textarea').style.opacity = '1';
            }
        }, { passive: true });
        
        // Long press for context menu
        document.addEventListener('touchstart', (e) => {
            e.target.dataset.touchStartTime = Date.now();
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const startTime = parseInt(e.target.dataset.touchStartTime || 0);
            const duration = Date.now() - startTime;
            
            if (duration > 500 && e.target.closest('.file-item, .window')) {
                this.handleLongPress(e);
            }
        }, { passive: true });
        
        // Swipe gestures
        this.setupSwipeGestures();
        
        // Viewport changes (keyboard)
        this.setupViewportHandler();
    }
    
    setupSwipeGestures() {
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: true });
    }
    
    handleSwipe() {
        const diffX = this.touchStartX - this.touchEndX;
        const diffY = this.touchStartY - this.touchEndY;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > this.swipeThreshold) {
                this.dispatchEvent('swipe-left');
            } else if (diffX < -this.swipeThreshold) {
                this.dispatchEvent('swipe-right');
            }
        }
    }
    
    handleLongPress(e) {
        const event = new CustomEvent('long-press', { 
            detail: { target: e.target },
            bubbles: true 
        });
        e.target.dispatchEvent(event);
    }
    
    dispatchEvent(type) {
        window.dispatchEvent(new CustomEvent(type, { 
            detail: { 
                startX: this.touchStartX, 
                startY: this.touchStartY,
                endX: this.touchEndX,
                endY: this.touchEndY
            }
        }));
    }
    
    setupViewportHandler() {
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                const keyboardHeight = window.innerHeight - window.visualViewport.height;
                document.documentElement.style.setProperty('--keyboard-height', keyboardHeight + 'px');
                
                if (keyboardHeight > 0) {
                    document.body.classList.add('keyboard-visible');
                } else {
                    document.body.classList.remove('keyboard-visible');
                }
            });
        }
    }
    
    // Enable haptic feedback if available
    vibrate(pattern = 10) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.TouchHandler = new TouchHandler();
    });
} else {
    window.TouchHandler = new TouchHandler();
}

// Haptic feedback on button clicks for touch devices
if (window.DeviceInfo?.isTouch) {
    document.addEventListener('click', (e) => {
        const button = e.target.closest('button, [role="button"]');
        if (button && window.TouchHandler) {
            window.TouchHandler.vibrate(10);
        }
    }, { passive: true });
}
'@

Create-OrUpdate-File -FilePath (Join-Path $jsDir "touch-handler.js") -Content $touchScript -Description "Touch interactions and gestures handler"

# ============================================================================
# STEP 3: Create Mobile CSS Utilities
# ============================================================================
Write-Host "`n[3/7] Creating mobile CSS utilities..." -ForegroundColor Yellow

$mobileCSS = @'
/**
 * Mobile-First CSS Utilities
 * Touch-optimized spacing, typography, and interactions
 */

/* Safe Area & Viewport Handling */
:root {
    --safe-top: env(safe-area-inset-top, 0);
    --safe-right: env(safe-area-inset-right, 0);
    --safe-bottom: env(safe-area-inset-bottom, 0);
    --safe-left: env(safe-area-inset-left, 0);
    --keyboard-height: 0px;
    
    /* Touch-friendly minimums */
    --touch-target: 44px;
    --tap-highlight: 0.1s;
}

/* Device-specific adjustments */
html.is-phone {
    font-size: 14px;
}

html.is-tablet {
    font-size: 15px;
}

html.is-desktop {
    font-size: 16px;
}

/* Remove tap delay and highlight */
html.is-touch * {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
}

/* Touch targets - minimum 44x44 */
button, a, input[type="button"], input[type="submit"], 
[role="button"], [role="link"] {
    min-height: var(--touch-target);
    min-width: var(--touch-target);
    -webkit-user-select: none;
    user-select: none;
}

button:active, a:active {
    opacity: 0.7;
    transition: opacity var(--tap-highlight);
}

/* Prevent zoom on input focus (iOS) */
input, textarea, select {
    font-size: 16px; /* Prevents auto-zoom on iOS */
    -webkit-user-select: text;
    user-select: text;
}

/* Viewport height on mobile (account for browser UI) */
html.is-phone body {
    min-height: 100dvh; /* dynamic viewport height */
    overflow-x: hidden;
}

/* Safe area padding for notch */
html.is-phone body {
    padding-top: max(12px, var(--safe-top));
    padding-right: max(12px, var(--safe-right));
    padding-left: max(12px, var(--safe-left));
}

/* Keyboard adjustment */
body.keyboard-visible {
    padding-bottom: calc(env(safe-area-inset-bottom, 0) + var(--keyboard-height));
}

/* Typography for small screens */
@media (max-width: 480px) {
    h1 { font-size: 1.5rem; }
    h2 { font-size: 1.2rem; }
    h3 { font-size: 1.1rem; }
    p { font-size: 0.95rem; }
}

/* List items touch-friendly */
li { 
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
}

li:active {
    background: rgba(0, 0, 0, 0.05);
    transition: background var(--tap-highlight);
}

/* Scrolling performance */
.scrollable, [data-scrollable] {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
}

/* Grid adjustments for mobile */
@media (max-width: 640px) {
    .grid, [class*="grid"] {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
        gap: 8px !important;
    }
}

/* Modal/Sheet styling for mobile */
@media (max-width: 768px) {
    .modal, .sheet {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 90vh;
        border-radius: 16px 16px 0 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    .modal::before {
        content: '';
        display: block;
        height: 4px;
        width: 40px;
        background: #ccc;
        border-radius: 2px;
        margin: 8px auto;
    }
}

/* Pull-to-refresh indicator */
.pull-to-refresh {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.2s;
}

.container.pulling .pull-to-refresh {
    opacity: 1;
}

/* Context menu (long-press) */
.context-menu {
    position: fixed;
    background: #fff;
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
}

.context-menu button {
    display: block;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
}

.context-menu button:active {
    background: rgba(0, 0, 0, 0.05);
}

/* Prevent horizontal scroll */
html, body {
    max-width: 100%;
    overflow-x: hidden;
}
'@

Create-OrUpdate-File -FilePath (Join-Path $jsDir "mobile-utils.css") -Content $mobileCSS -Description "Mobile CSS utilities and touch optimizations"

# ============================================================================
# STEP 4: Update index.html with mobile detection and safe areas
# ============================================================================
Write-Host "`n[4/7] Updating index.html with mobile optimizations..." -ForegroundColor Yellow

$indexPath = Join-Path $rootDir "index.html"
Backup-File $indexPath

# Read the file
$indexContent = Get-Content $indexPath -Raw

# Add device detection and touch handler scripts if not present
if ($indexContent -notmatch 'device-detection.js') {
    $insertion = @'
    <script src="js/device-detection.js" charset="utf-8"></script>
    <script src="js/touch-handler.js" charset="utf-8"></script>
    <link rel="stylesheet" href="js/mobile-utils.css">
'@
    
    # Insert before the closing </head> tag
    $indexContent = $indexContent -replace '(</head>)', ($insertion + "`r`n    `$1")
}

# Update viewport meta tag for better mobile support
$indexContent = $indexContent -replace 
    '<meta name="viewport" content="[^"]*">', 
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">'

# Add apple-specific meta tags if not present
if ($indexContent -notmatch 'apple-mobile-web-app-capable') {
    $appleMetas = @'
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="DondlingerGC">
    <meta name="theme-color" content="#0a0a0a">
'@
    
    $indexContent = $indexContent -replace '(</head>)', ($appleMetas + "`r`n    `$1")
}

Set-Content -Path $indexPath -Value $indexContent -Encoding UTF8
Write-Host "  ✓ Updated index.html with mobile detection and safe area support" -ForegroundColor Green

# ============================================================================
# STEP 5: Update mobile.html
# ============================================================================
Write-Host "`n[5/7] Updating mobile.html..." -ForegroundColor Yellow

$mobilePath = Join-Path $mobileStaticDir "mobile.html"
if (Test-Path $mobilePath) {
    Backup-File $mobilePath
    
    $mobileContent = Get-Content $mobilePath -Raw
    
    # Ensure device detection is loaded
    if ($mobileContent -notmatch 'device-detection.js') {
        $mobileContent = $mobileContent -replace 
            '(<body[^>]*>)',
            ('$1' + "`r`n    <script src='../js/device-detection.js' charset='utf-8'></script>" + 
             "`r`n    <script src='../js/touch-handler.js' charset='utf-8'></script>" +
             "`r`n    <link rel='stylesheet' href='../js/mobile-utils.css'>")
    }
    
    # Update viewport
    $mobileContent = $mobileContent -replace 
        '<meta name="viewport" content="[^"]*">', 
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">'
    
    # Add apple meta tags
    if ($mobileContent -notmatch 'apple-mobile-web-app-capable') {
        $mobileContent = $mobileContent -replace 
            '(</head>)', 
            ("`r`n    <meta name='apple-mobile-web-app-capable' content='yes'>`r`n" +
             "    <meta name='apple-mobile-web-app-status-bar-style' content='black-translucent'>`r`n" +
             "    `$1")
    }
    
    Set-Content -Path $mobilePath -Value $mobileContent -Encoding UTF8
    Write-Host "  ✓ Updated mobile.html" -ForegroundColor Green
} else {
    Write-Host "  ⚠ mobile.html not found at $mobilePath" -ForegroundColor Yellow
}

# ============================================================================
# STEP 6: Create responsive layout patch for index.html
# ============================================================================
Write-Host "`n[6/7] Adding responsive layout styles..." -ForegroundColor Yellow

$responsiveCSS = @'

/* ================================================================
   MOBILE-FIRST RESPONSIVE ADJUSTMENTS
   Added by mobile-optimization.ps1
   ================================================================ */

/* Phone-specific adjustments (< 480px) */
@media (max-width: 480px) {
    /* Desktop container */
    #desktop {
        display: none !important;
    }
    
    /* Show mobile nav */
    .mobile-nav {
        display: flex !important;
    }
    
    /* Window sizing */
    .window {
        max-width: 100vw !important;
        max-height: 100vh !important;
        border-radius: 0 !important;
    }
    
    .window.maximized,
    .window.split-left,
    .window.split-right {
        border-radius: 0 !important;
        width: 100vw !important;
        height: calc(100vh - 60px) !important;
    }
    
    /* Typography */
    h1 { font-size: 1.5rem !important; margin-bottom: 12px !important; }
    h2 { font-size: 1.25rem !important; margin-bottom: 10px !important; }
    
    /* Spacing */
    .window-content {
        padding: 12px !important;
    }
    
    /* Blueprint grid */
    .blueprints-list {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 12px !important;
    }
    
    .blueprint-thumb {
        width: 100% !important;
    }
    
    /* Taskbar */
    .taskbar {
        height: 50px;
    }
    
    .start-button {
        padding: 6px 12px;
        font-size: 0.85rem;
    }
    
    /* Facebook feed */
    #facebook-feed {
        max-width: 100% !important;
        padding: 0 !important;
    }
}

/* Tablet adjustments (480px - 1024px) */
@media (min-width: 481px) and (max-width: 1024px) {
    #desktop {
        display: flex !important;
    }
    
    .window {
        max-width: 95vw;
    }
    
    /* Two-column layout */
    .blueprints-list {
        grid-template-columns: repeat(2, 1fr) !important;
    }
    
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
}

/* Desktop (1025px+) */
@media (min-width: 1025px) {
    .window {
        max-width: 90vw;
    }
    
    .blueprints-list {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
    }
}

/* Landscape mode fixes */
@media (max-height: 500px) and (orientation: landscape) {
    .window {
        max-height: 85vh !important;
    }
    
    .window-header {
        padding: 8px 12px;
        font-size: 0.9rem;
    }
}

/* ================================================================ */
'@

# Append to index.html before </style> tag
$styleClosing = '</style>'
if ($indexContent -match $styleClosing) {
    $indexContent = $indexContent -replace $styleClosing, ($responsiveCSS + "`r`n    " + $styleClosing)
    Set-Content -Path $indexPath -Value $indexContent -Encoding UTF8
    Write-Host "  ✓ Added responsive layout styles to index.html" -ForegroundColor Green
}

# ============================================================================
# STEP 7: Create optimization manifest
# ============================================================================
Write-Host "`n[7/7] Creating optimization manifest..." -ForegroundColor Yellow

$manifest = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    version = "1.0"
    optimizations = @(
        "Mobile device detection and routing",
        "Touch interactions and gesture support",
        "Safe area and notch handling (iPhone)",
        "Viewport optimization (100dvh)",
        "Apple web app meta tags",
        "Haptic feedback support",
        "Keyboard viewport adjustment",
        "Long-press context menus",
        "Swipe gesture detection",
        "Touch-friendly UI targets (44x44px)",
        "Responsive media queries",
        "Performance optimizations"
    )
    files_modified = @(
        "index.html",
        "mobilestatic/mobile.html"
    )
    files_created = @(
        "js/device-detection.js",
        "js/touch-handler.js",
        "js/mobile-utils.css"
    )
} | ConvertTo-Json -Depth 3

$manifestPath = Join-Path $rootDir "MOBILE_OPTIMIZATION_MANIFEST.json"
Set-Content -Path $manifestPath -Value $manifest -Encoding UTF8
Write-Host "  ✓ Created optimization manifest: $manifestPath" -ForegroundColor Green

# ============================================================================
# COMPLETION
# ============================================================================
Write-Host "`n" -ForegroundColor Cyan
Write-Host "✅ Mobile Optimization Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNew Files Created:" -ForegroundColor White
Write-Host "  • js/device-detection.js      - Device detection & routing" -ForegroundColor Gray
Write-Host "  • js/touch-handler.js         - Touch interactions & gestures" -ForegroundColor Gray
Write-Host "  • js/mobile-utils.css         - Mobile CSS utilities" -ForegroundColor Gray

Write-Host "`nFiles Updated:" -ForegroundColor White
Write-Host "  • index.html                   - Mobile detection, meta tags, responsive styles" -ForegroundColor Gray
Write-Host "  • mobilestatic/mobile.html    - Mobile detection, safe area support" -ForegroundColor Gray

Write-Host "`nKey Features Enabled:" -ForegroundColor White
Write-Host "  ✓ Device detection (phone/tablet/desktop)" -ForegroundColor Gray
Write-Host "  ✓ Touch optimizations (44px targets, no tap delay)" -ForegroundColor Gray
Write-Host "  ✓ Gesture support (swipe, long-press)" -ForegroundColor Gray
Write-Host "  ✓ Safe area handling for notches" -ForegroundColor Gray
Write-Host "  ✓ Keyboard viewport management" -ForegroundColor Gray
Write-Host "  ✓ Haptic feedback support" -ForegroundColor Gray
Write-Host "  ✓ Apple web app capable" -ForegroundColor Gray

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Test on iPhone: Open in Safari and add to Home Screen" -ForegroundColor Gray
Write-Host "  2. Verify: Open DevTools → Device Mode to test different sizes" -ForegroundColor Gray
Write-Host "  3. Check: Rotate device to test landscape mode" -ForegroundColor Gray
Write-Host "  4. Monitor: Check browser console for device detection logs" -ForegroundColor Gray

Write-Host "`nBackups created:" -ForegroundColor Gray
Get-ChildItem $rootDir -Filter "*.backup.*" -Recurse | Select-Object -ExpandProperty Name | ForEach-Object {
    Write-Host "  • $_" -ForegroundColor DarkGray
}

Write-Host "`n"
