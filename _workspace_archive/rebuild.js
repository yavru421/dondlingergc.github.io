const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('index.html', 'utf8');

// Load HTML keeping the exact tags
const $ = cheerio.load(html, { decodeEntities: false });

const wazContainer = $('#wazeecha-telemetry');

// 1. Convert wazContainer to horizontal snap
let wazStyle = wazContainer.attr('style') || '';
wazStyle = wazStyle.replace(/overflow-y:[^;]+;/g, '');
wazStyle = wazStyle.replace(/scroll-snap-type:[^;]+;/g, '');
wazStyle += ' display: flex; flex-direction: row; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; scroll-behavior: smooth;';
wazContainer.attr('style', wazStyle);

// 2. Keep core cards, delete the rest
$('#waz-mode-portal').remove();
$('#card-forecast').remove();
$('#card-aqi').remove();
$('#card-push').remove();
$('#waz-nav-hud').remove();
$('#hud-restore-btn').remove();
$('#scroll-indicator').remove();

const cardsToKeep = ['#card-now', '#card-radar', '#card-hydro', '#nws-alerts-card'];

cardsToKeep.forEach(id => {
    const card = $(id);
    if (!card.length) return;
    
    // Convert to swipe slide
    card.addClass('tinder-card');
    
    let style = card.attr('style') || '';
    style += ' width: 100vw; height: 100vh; flex-shrink: 0; scroll-snap-align: start; scroll-snap-stop: always; overflow-y: auto; padding: 24px; box-sizing: border-box;';
    card.attr('style', style);
});

// Radar special handling
const radar = $('#card-radar');
if (radar.length) {
    let style = radar.attr('style') || '';
    style += ' padding: 0 !important; margin: 0; border-radius: 0;';
    radar.attr('style', style);
    
    const iframe = radar.find('iframe');
    iframe.attr('style', 'width: 100%; height: 100%; border: none; position: absolute; inset: 0;');
    
    radar.find('button[onclick="toggleRadarFullscreen()"]').remove();
}

// Dots
const dotsHTML = `
<style>
    /* Snapchat style dot indicators */
    #tinder-dots {
        position: fixed;
        top: env(safe-area-inset-top, 16px);
        left: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        gap: 8px;
        z-index: 10000;
        pointer-events: none;
        padding-top: 16px;
    }
    .tinder-dot {
        width: 12%;
        max-width: 40px;
        height: 4px;
        background: rgba(255,255,255,0.3);
        border-radius: 4px;
        transition: background 0.3s;
    }
    .tinder-dot.active {
        background: rgba(255,255,255,0.9);
        box-shadow: 0 0 8px rgba(255,255,255,0.5);
    }
</style>
<div id="tinder-dots">
    <div class="tinder-dot active"></div>
    <div class="tinder-dot"></div>
    <div class="tinder-dot"></div>
    <div class="tinder-dot"></div>
</div>
`;
wazContainer.prepend(dotsHTML);

const scriptHTML = `
<script>
    const tinderContainer = document.getElementById('wazeecha-telemetry');
    const tinderDots = document.querySelectorAll('.tinder-dot');
    
    if (tinderContainer) {
        tinderContainer.addEventListener('scroll', () => {
            const index = Math.round(tinderContainer.scrollLeft / window.innerWidth);
            tinderDots.forEach(d => d.classList.remove('active'));
            if (tinderDots[index]) {
                tinderDots[index].classList.add('active');
            }
        }, { passive: true });
    }
</script>
`;
wazContainer.append(scriptHTML);

let newHtml = $.html();

// Now, handle the fragile Javascript cleanup using accurate regex boundaries
// Remove Scroll snap handler block perfectly
const snapRegex = /\/\/ Scroll snap handler \(haptics \+ HUD dot active state tracking\)[\s\S]*?telemetrySection\.addEventListener\('scroll', \(\) => \{[\s\S]*?\}, \{ passive: true \}\);\n\s*\}/;
newHtml = newHtml.replace(snapRegex, '// Scroll snap handler removed');

// Remove AUTO-COLLAPSE LOGIC block perfectly
const collapseRegex = /\/\/ AUTO-COLLAPSE LOGIC[\s\S]*?resetHudCollapseTimeout\(\);/;
newHtml = newHtml.replace(collapseRegex, '// Auto collapse removed');

fs.writeFileSync('index.html', newHtml, 'utf8');
console.log('Rebuild complete!');
