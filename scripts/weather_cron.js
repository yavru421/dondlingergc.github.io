const fs = require('fs');
const https = require('https');

// Open-Meteo URL for Lake Wazeecha
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=44.3936&longitude=-89.8173&current=temperature_2m,precipitation,weather_code,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=America%2FChicago&wind_speed_unit=mph&precipitation_unit=inch&temperature_unit=fahrenheit';

// USGS URL for Wisconsin River (Site 05400760)
const USGS_URL = 'https://waterservices.usgs.gov/nwis/iv/?format=json&sites=05400760&parameterCd=00060,00065&siteStatus=all';

const STATE_FILE = 'cooldown.json';

// Helper to convert WMO Weather Codes to descriptive text
function getWeatherDescription(code) {
    if (code === 0) return "Clear sky";
    if (code === 1) return "Mainly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if (code === 45 || code === 48) return "Foggy";
    if (code >= 51 && code <= 55) return "Drizzle";
    if (code >= 56 && code <= 57) return "Freezing drizzle";
    if (code >= 61 && code <= 65) return "Rain";
    if (code >= 66 && code <= 67) return "Freezing rain";
    if (code >= 71 && code <= 75) return "Snowfall";
    if (code === 77) return "Snow grains";
    if (code >= 80 && code <= 82) return "Rain showers";
    if (code >= 85 && code <= 86) return "Snow showers";
    if (code >= 95) return "Thunderstorms";
    return "Cloudy";
}

async function fetchWeather() {
    return new Promise((resolve, reject) => {
        https.get(WEATHER_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function fetchUSGS() {
    return new Promise((resolve, reject) => {
        https.get(USGS_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}


function readState() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

function writeState(data) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
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

    console.log(`Sending Broadcast: [${title}] -> "${message}"`);

    const httpModule = broadcastUrl.startsWith('https:') ? require('https') : require('http');

    return new Promise((resolve, reject) => {
        const req = httpModule.request(broadcastUrl, {
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

// Wrap broadcast in a try-catch so individual alert failures don't halt the cron execution
async function trySendBroadcast(title, message) {
    try {
        await sendBroadcast(title, message);
        return true;
    } catch (e) {
        console.error(`Failed to send broadcast [${title}]:`, e.message);
        return false;
    }
}

async function main() {
    try {
        console.log("Fetching weather data from Open-Meteo...");
        const data = await fetchWeather();
        
        console.log("Fetching river data from USGS...");
        const usgsData = await fetchUSGS();

        const current = data.current;
        const daily = data.daily;
        
        if (!current || !daily) {
            console.error("No valid current or daily weather data found.");
            return;
        }

        const state = readState();
        
        // Parse local time and date from current time (America/Chicago)
        // Format: "2026-06-21T09:30"
        const currentTimeStr = current.time;
        const [todayDate, timePart] = currentTimeStr.split('T');
        const localHour = parseInt(timePart.split(':')[0], 10);
        
        console.log(`Local Time: ${timePart} (${todayDate}), Temp: ${current.temperature_2m}°F, Wind: ${current.wind_gusts_10m} mph`);

        // 1. DAILY MORNING FORECAST PUSH
        // Triggers once a day at or after 7:00 AM local time
        if (localHour >= 7 && state.daily_forecast_sent_date !== todayDate) {
            const maxTemp = daily.temperature_2m_max[0];
            const minTemp = daily.temperature_2m_min[0];
            const precip = daily.precipitation_sum[0];
            const cond = getWeatherDescription(daily.weather_code[0]);
            
            const title = "Daily Weather Forecast";
            const message = `Good morning! Today's forecast for Lake Wazeecha: High of ${maxTemp}°F, Low of ${minTemp}°F. Expected precipitation: ${precip} in. Conditions: ${cond}.`;
            
            const success = await trySendBroadcast(title, message);
            if (success) {
                state.daily_forecast_sent_date = todayDate;
            }
        }

        // 2. DAYTIME HIGH TEMPERATURE ALERT
        if (state.high_temp_reached_sent_date !== todayDate) {
            const maxTemp = daily.temperature_2m_max[0];
            const currentTemp = current.temperature_2m;
            
            if (currentTemp >= (maxTemp - 1.5)) {
                const title = "Weather Alert: Peak Temp";
                const message = `Daily High Reached: Lake Wazeecha temperature has peaked at ${currentTemp}°F today (forecasted high: ${maxTemp}°F).`;
                
                const success = await trySendBroadcast(title, message);
                if (success) {
                    state.high_temp_reached_sent_date = todayDate;
                }
            }
        }

        // 3. DAYTIME LOW TEMPERATURE ALERT
        // Restrict to at or after 4:00 AM to avoid sending in the middle of the night
        if (localHour >= 4 && state.low_temp_reached_sent_date !== todayDate) {
            const minTemp = daily.temperature_2m_min[0];
            const currentTemp = current.temperature_2m;
            
            if (currentTemp <= (minTemp + 1.5)) {
                const title = "Weather Alert: Low Temp";
                const message = `Daily Low Reached: Lake Wazeecha temperature has dropped to ${currentTemp}°F (forecasted low: ${minTemp}°F).`;
                
                const success = await trySendBroadcast(title, message);
                if (success) {
                    state.low_temp_reached_sent_date = todayDate;
                }
            }
        }

        // 4. RAIN START / STOP TRANSITIONS
        const isRainingNow = current.precipitation > 0;
        const wasRainingPrev = state.is_raining === true;

        if (isRainingNow && !wasRainingPrev) {
            const title = "Weather Alert: Rain Started";
            const message = "Rain has started falling at Lake Wazeecha.";
            const success = await trySendBroadcast(title, message);
            if (success) {
                state.is_raining = true;
            }
        } else if (!isRainingNow && wasRainingPrev) {
            const title = "Weather Alert: Rain Stopped";
            const message = "Rain has stopped at Lake Wazeecha.";
            const success = await trySendBroadcast(title, message);
            if (success) {
                state.is_raining = false;
            }
        }

        // 5. WIND GUST MILESTONES
        const currentWind = current.wind_gusts_10m;
        
        // Reset wind tracking if day has changed
        if (state.wind_date !== todayDate) {
            state.wind_date = todayDate;
            state.highest_wind_gust_seen_today = 0;
        }
        
        const highestGust = state.highest_wind_gust_seen_today || 0;
        let thresholdCrossed = null;

        if (currentWind >= 35 && highestGust < 35) {
            thresholdCrossed = 35;
        } else if (currentWind >= 25 && highestGust < 25) {
            thresholdCrossed = 25;
        } else if (currentWind >= 15 && highestGust < 15) {
            thresholdCrossed = 15;
        }

        if (thresholdCrossed) {
            const title = "Weather Alert: High Winds";
            const message = `High wind gusts of ${currentWind} mph detected at Lake Wazeecha (crossed ${thresholdCrossed} mph threshold).`;
            const success = await trySendBroadcast(title, message);
            if (success) {
                state.highest_wind_gust_seen_today = Math.max(highestGust, currentWind);
            }
        }

        // 6. THUNDERSTORM / SEVERE WEATHER (Fallback cooldown-based alert)
        const code = current.weather_code || 0;
        if (code >= 95) {
            const alertType = 'thunderstorm';
            if (!state.last_alert_time) {
                state.last_alert_time = {};
            }
            const lastAlertTime = state.last_alert_time[alertType] || 0;
            const now = Date.now();
            
            // 4 hour cooldown for severe weather thunderstorm warnings
            if (now - lastAlertTime > (4 * 60 * 60 * 1000)) {
                const title = "DANGER: Thunderstorm";
                const message = "Severe thunderstorms detected at Lake Wazeecha. Secure the site.";
                const success = await trySendBroadcast(title, message);
                if (success) {
                    state.last_alert_time[alertType] = now;
                }
            }
        }

        // 7. RIVER DATA ALERTS (USGS)
        try {
            if (usgsData && usgsData.value && usgsData.value.timeSeries) {
                const timeSeries = usgsData.value.timeSeries;
                let currentDischarge = null;
                let currentGauge = null;

                for (const ts of timeSeries) {
                    const variableCode = ts.variable.variableCode[0].value;
                    const values = ts.values[0].value;
                    if (values && values.length > 0) {
                        const latestValue = parseFloat(values[values.length - 1].value);
                        if (variableCode === '00060') currentDischarge = latestValue;
                        if (variableCode === '00065') currentGauge = latestValue;
                    }
                }

                console.log(`USGS River Data - Discharge: ${currentDischarge} cfs, Gauge Height: ${currentGauge} ft`);

                if (currentDischarge !== null) {
                    // Alert if discharge > 10,000 cfs
                    if (currentDischarge > 10000 && state.last_high_discharge_alert !== todayDate) {
                        const title = "River Alert: High Discharge";
                        const message = `Wisconsin River discharge is critically high at ${currentDischarge} cfs.`;
                        const success = await trySendBroadcast(title, message);
                        if (success) state.last_high_discharge_alert = todayDate;
                    }
                }

                if (currentGauge !== null) {
                    // Alert if gauge height > 15 ft
                    if (currentGauge > 15 && state.last_high_gauge_alert !== todayDate) {
                        const title = "River Alert: High Gauge";
                        const message = `Wisconsin River gauge height is critically high at ${currentGauge} ft.`;
                        const success = await trySendBroadcast(title, message);
                        if (success) state.last_high_gauge_alert = todayDate;
                    }
                }
            }
        } catch (usgsErr) {
            console.error("Error evaluating USGS data:", usgsErr);
        }

        // Write state back to JSON file
        writeState(state);
        console.log("Weather cron checks completed successfully.");

    } catch (e) {
        console.error("Error running weather cron:", e);
        process.exit(1);
    }
}

main();
