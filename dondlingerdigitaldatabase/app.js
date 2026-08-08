// Metropolis Neural Oracle 20Q Logic with Neuron Fuel Meter
document.addEventListener('DOMContentLoaded', () => {
    const oracleQuestions = [
        "Is your secret concept a physical hardware object (rather than software or a digital utility)?",
        "Is it a database engine, query framework, or developer productivity tool?",
        "Does it involve Zero-Liability Architecture (ZLA), encryption, or client data privacy?",
        "Is it a mobile progressive web app (PWA) or interactive browser dashboard?",
        "Is it an audio soundboard, WebAudio synth, or sound diagnostic tool?",
        "Does it track real-time weather telemetry, atmospheric radar, or river hydrology?",
        "Is it a peer-to-peer file transfer engine (like WebRTC or SkyDrop)?",
        "Does it perform concrete estimations, field ticket tracking, or construction site calculations?",
        "Is it built using WebAssembly (WASM) or MudBlazor component frameworks?",
        "Is it a live GPS or ETA location broadcasting utility (like On My Way)?",
        "Does it compile video storyboards or generate PDF reports?",
        "Is it an analytical database lake like DuckDB or SQL query engine?",
        "Does it enforce zero server-side data storage or login account requirements?",
        "Is it an interactive touchscreen hardware diagnostic tool?",
        "Does it run on Cloudflare Workers AI edge models or subagent runtimes?",
        "Is it a voice recording client onboarding utility?",
        "Is it a theme customizer or desktop taskbar state manager?",
        "Is it part of the Dondlinger Digital Database software suite?",
        "Final Neuron Step: Is your secret concept the PourReady Estimator or WaZ Weather?",
        "Final Deduction: Synthesizing final AI thought matrix..."
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

    let history = [];

    async function fetchNextQuestionFromEdge(answer = null) {
        if (answer) {
            history.push({ q: oracleQuestions[(stepIndex - 1) % oracleQuestions.length], a: answer });
        }

        try {
            const res = await fetch('https://orchestrator-do.yavru421.workers.dev/api/oracle-20q', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: history,
                    neuronsRemaining: neuronsRemaining,
                    stepIndex: stepIndex
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.question) {
                    if (speechEl) speechEl.innerHTML = `<strong>🔮 Oracle asks (Neuron #${21 - neuronsRemaining}):</strong> "${data.question}"`;
                    if (data.confidence) confidencePercent = data.confidence;
                    if (confidenceVal && confidenceFill) {
                        confidenceVal.innerText = `${confidencePercent}%`;
                        confidenceFill.style.width = `${confidencePercent}%`;
                    }
                    return;
                }
            }
        } catch (e) {
            // Local high-speed fallback
        }

        askQuestionLocal();
    }

    const choiceBtns = document.querySelectorAll('.btn-choice');
    choiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const userChoice = btn.getAttribute('data-answer');
            neuronsRemaining--;
            stepIndex++;
            confidencePercent = Math.min(98, confidencePercent + Math.floor(Math.random() * 8 + 4));

            updateFuelGauge();

            if (neuronsRemaining <= 0) {
                const isOracleVictory = confidencePercent >= 70 || Math.random() > 0.4;
                if (isOracleVictory) {
                    handleOracleVictory();
                } else {
                    handlePlayerVictory();
                }
            } else {
                fetchNextQuestionFromEdge(userChoice);
            }
        });
    });

    function askQuestionLocal() {
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
