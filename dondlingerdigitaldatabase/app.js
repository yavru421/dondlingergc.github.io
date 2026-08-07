// Metropolis Neural Oracle 20Q Logic with Neuron Fuel Meter
document.addEventListener('DOMContentLoaded', () => {
    const oracleQuestions = [
        "Is your secret item a physical hardware object (rather than software or an abstract concept)?",
        "Is it directly connected to energy, hydro-power, or electrical grid infrastructure?",
        "Is it a database engine, query framework, or developer coding tool?",
        "Is it rooted or physically operating in Wisconsin / Wisconsin Rapids?",
        "Does it involve Zero-Liability Architecture (ZLA), encryption, or client key sovereignty?",
        "Is it a mobile web application or browser-based PWA dashboard?",
        "Is it an audio soundboard, WebAudio sample player, or acoustic tool?",
        "Does it track atmospheric telemetry, storm radar, or weather forecasts?",
        "Is it an open-source framework, MudBlazor component, or WASM runtime?",
        "Does it relate to paper manufacturing mills or Wisconsin River dam infrastructure?",
        "Is it a peer-to-peer file transfer engine (like PeerJS or Skydrop)?",
        "Is it an analytical DuckDB telemetry lake or SQL query engine?",
        "Does it enforce zero server-side data retention or privacy guarantees?",
        "Is it part of the dondlingergc.com web application suite?",
        "Does it utilize Cloudflare Workers AI edge models or subagent routing?",
        "Is it a field inspection tool for jobsite reporting or intake management?",
        "Is it an interactive UI design system like Metropolis Dark glassmorphism?",
        "Is it related to Wisconsin River hydro-cooling data center concepts?",
        "Final Neuron Step: Is your secret concept the Dondlinger Digital Database?",
        "Final Deduction: Synthesizing final ZLA thought matrix..."
    ];

    let neuronsRemaining = 20;
    let stepIndex = 0;
    let confidencePercent = 12;

    const startBtn = document.getElementById('btn-start-game');
    const choiceBox = document.getElementById('choice-buttons');
    const gameControls = document.getElementById('game-controls');
    const speechEl = document.getElementById('oracle-speech');
    const fuelCountEl = document.getElementById('fuel-count');
    const fuelFillEl = document.getElementById('fuel-fill');
    const confidenceWrap = document.getElementById('confidence-wrap');
    const confidenceVal = document.getElementById('confidence-val');
    const confidenceFill = document.getElementById('confidence-fill');

    const oracleWishBox = document.getElementById('oracle-wish-box');
    const oracleWinBox = document.getElementById('oracle-win-box');
    const grantWishBtn = document.getElementById('btn-grant-wish');
    const wishInput = document.getElementById('wish-input');
    const wishOutput = document.getElementById('wish-output');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            neuronsRemaining = 20;
            stepIndex = 0;
            confidencePercent = 12;

            gameControls.style.display = 'none';
            choiceBox.style.display = 'flex';
            if (confidenceWrap) confidenceWrap.style.display = 'block';
            if (oracleWishBox) oracleWishBox.style.display = 'none';
            if (oracleWinBox) oracleWinBox.style.display = 'none';

            updateFuelGauge();
            askQuestion();
        });
    }

    const choiceBtns = document.querySelectorAll('.btn-choice');
    choiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            neuronsRemaining--;
            stepIndex++;
            confidencePercent = Math.min(98, confidencePercent + Math.floor(Math.random() * 8 + 4));

            updateFuelGauge();

            if (neuronsRemaining <= 0) {
                // Determine Victory or Defeat
                const isOracleVictory = Math.random() > 0.45;
                if (isOracleVictory) {
                    handleOracleVictory();
                } else {
                    handlePlayerVictory();
                }
            } else {
                askQuestion();
            }
        });
    });

    function askQuestion() {
        if (speechEl) {
            speechEl.innerHTML = `<strong>🔮 Oracle asks (Neuron #${21 - neuronsRemaining}):</strong> "${oracleQuestions[stepIndex % oracleQuestions.length]}"`;
        }
        if (confidenceVal && confidenceFill) {
            confidenceVal.innerText = `${confidencePercent}%`;
            confidenceFill.style.width = `${confidencePercent}%`;
        }
    }

    function updateFuelGauge() {
        if (fuelCountEl) fuelCountEl.innerText = `${neuronsRemaining}/20`;
        if (fuelFillEl) {
            const pct = (neuronsRemaining / 20) * 100;
            fuelFillEl.style.width = `${pct}%`;
            if (pct < 30) {
                fuelFillEl.style.background = 'linear-gradient(90deg, #ef4444, #f59e0b)';
            } else {
                fuelFillEl.style.background = 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))';
            }
        }
    }

    function handlePlayerVictory() {
        choiceBox.style.display = 'none';
        if (confidenceWrap) confidenceWrap.style.display = 'none';
        if (speechEl) {
            speechEl.innerHTML = `<strong>🔮 Metropolis Oracle:</strong> "NEURON FUEL DEPLETED! You outsmarted the 20-Neuron budget. The Oracle surrenders! Type your prompt below to extract raw Oracle wisdom!"`;
        }
        if (oracleWishBox) oracleWishBox.style.display = 'block';
    }

    function handleOracleVictory() {
        choiceBox.style.display = 'none';
        if (confidenceWrap) confidenceWrap.style.display = 'none';
        if (speechEl) {
            speechEl.innerHTML = `<strong>🔮 Metropolis Oracle:</strong> "DEDUCTION SYNTHESIZED! Your thought pattern matches the <i>Wisconsin Rapids Tech & ZLA Ecosystem</i>! Take your VIP application tour below."`;
        }
        if (oracleWinBox) oracleWinBox.style.display = 'block';
    }

    if (grantWishBtn) {
        grantWishBtn.addEventListener('click', () => {
            const promptVal = wishInput ? wishInput.value.trim() : '';
            if (promptVal && wishOutput) {
                wishOutput.style.display = 'block';
                wishOutput.innerHTML = `<strong>✨ Oracle Wisdom:</strong> "Regarding '<i>${promptVal}</i>': Your concept aligns with Zero-Liability Architecture (ZLA) and Cloudflare Workers AI edge processing. Built for speed and sovereign data ownership."`;
            }
        });
    }
});
