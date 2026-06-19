const fs = require('fs');
const https = require('https');

// Open-Meteo URL for Lake Wazeecha (Current conditions)
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=44.3936&longitude=-89.8173&current=precipitation,weather_code,wind_gusts_10m&timezone=America%2FChicago&wind_speed_unit=mph';

const COOLDOWN_FILE = 'cooldown.json';
const COOLDOWN_HOURS = 4; // Prevent spamming notifications for the same event type within 4 hours

async function fetchWeather() {
    return new Promise((resolve, reject) => {
        https.get(WEATHER_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

function readCooldowns() {
    if (fs.existsSync(COOLDOWN_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(COOLDOWN_FILE, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function writeCooldowns(data) {
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
}

async function sendBroadcast(title, message) {
    const siteUrl = process.env.SITE_URL;
    const apiSecret = process.env.API_SECRET;

    if (!siteUrl || !apiSecret) {
        console.error("Missing SITE_URL or API_SECRET environment variables.");
        process.exit(1);
    }

    const broadcastUrl = `${siteUrl.replace(/\/$/, '')}/broadcast`;
    const payload = JSON.stringify({ title, message });

    return new Promise((resolve, reject) => {
        const req = https.request(broadcastUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiSecret}`,
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data);
                } else {
                    reject(new Error(`Broadcast failed with status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function main() {
    try {
        console.log("Fetching current weather...");
        const data = await fetchWeather();
        const current = data.current;
        
        if (!current) {
            console.error("No current weather data found.");
            return;
        }

        const code = current.weather_code || 0;
        const wind = current.wind_gusts_10m || 0;
        
        let alertType = null;
        let title = "";
        let message = "";

        if (code >= 95) {
            alertType = 'thunderstorm';
            title = "DANGER: Thunderstorms";
            message = "Severe thunderstorms detected at Lake Wazeecha. Secure the site.";
        } else if (code >= 61 && code <= 67) {
            alertType = 'rain';
            title = "Weather Alert: Heavy Rain";
            message = "Steady/Heavy rain detected at Lake Wazeecha. Work may be halted.";
        } else if (code >= 51 && code <= 55) {
             alertType = 'drizzle';
             title = "Weather Alert: Light Rain";
             message = "Light rain/drizzle detected at the site.";
        } else if (wind > 25) {
            alertType = 'wind';
            title = "Weather Alert: High Winds";
            message = `High wind gusts of ${wind} mph detected at Lake Wazeecha.`;
        }

        if (alertType) {
            console.log(`Weather Alert triggered: ${alertType}`);
            const cooldowns = readCooldowns();
            const lastAlertTime = cooldowns[alertType] || 0;
            const now = Date.now();

            if (now - lastAlertTime > (COOLDOWN_HOURS * 60 * 60 * 1000)) {
                console.log(`Cooldown cleared. Sending broadcast...`);
                await sendBroadcast(title, message);
                console.log(`Broadcast sent successfully.`);
                
                cooldowns[alertType] = now;
                writeCooldowns(cooldowns);
            } else {
                console.log(`Alert suppressed due to cooldown. (Last sent ${Math.round((now - lastAlertTime)/60000)} mins ago)`);
            }
        } else {
            console.log("Weather is clear. No alerts to send.");
        }

    } catch (e) {
        console.error("Error running weather cron:", e);
        process.exit(1);
    }
}

main();
