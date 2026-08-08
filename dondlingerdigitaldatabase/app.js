// Metropolis Neural Oracle 20Q Chat Thread Engine
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
    let history = [];

    const chatThread = document.getElementById('chat-thread');
    const choiceBox = document.getElementById('choice-buttons');
    const chatForm = document.getElementById('chat-input-form');
    const chatInputField = document.getElementById('chat-input-field');
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

    // Automatically post first question on load
    setTimeout(() => {
        postOracleMessage(`Neuron #1 Question: "${oracleQuestions[0]}"`);
    }, 600);

    function appendUserMessage(text) {
        if (!chatThread) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-bubble user';
        msgDiv.innerHTML = `<strong>👤 You:</strong> ${text}`;
        chatThread.appendChild(msgDiv);
        chatThread.scrollTop = chatThread.scrollHeight;
    }

    function postOracleMessage(text) {
        if (!chatThread) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-bubble oracle';
        msgDiv.innerHTML = `<strong>🔮 Oracle:</strong> ${text}`;
        chatThread.appendChild(msgDiv);
        chatThread.scrollTop = chatThread.scrollHeight;
    }

    async function handleUserAnswer(userAnswerText) {
        if (!userAnswerText) return;

        appendUserMessage(userAnswerText);
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
            return;
        }

        // Attempt edge inference
        try {
            history.push({ q: oracleQuestions[(stepIndex - 1) % oracleQuestions.length], a: userAnswerText });
            const res = await fetch('https://orchestrator-do.yavru421.workers.dev/api/oracle-20q', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history, neuronsRemaining, stepIndex })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.question) {
                    postOracleMessage(`Neuron #${21 - neuronsRemaining}: "${data.question}"`);
                    if (data.confidence) confidencePercent = data.confidence;
                    updateConfidence();
                    return;
                }
            }
        } catch (e) {
            // Local fallback
        }

        const nextQ = oracleQuestions[stepIndex % oracleQuestions.length];
        postOracleMessage(`Neuron #${21 - neuronsRemaining}: "${nextQ}"`);
        updateConfidence();
    }

    // Quick Choice Buttons
    const choiceBtns = document.querySelectorAll('.btn-choice');
    choiceBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const val = btn.getAttribute('data-answer');
            const label = val === 'yes' ? 'Yes 👍' : (val === 'no' ? 'No 👎' : 'Maybe / Unsure 🤔');
            handleUserAnswer(label);
        });
    });

    // Text Form Input
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInputField.value.trim();
            if (text) {
                chatInputField.value = '';
                handleUserAnswer(text);
            }
        });
    }

    function updateConfidence() {
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
        if (choiceBox) choiceBox.style.display = 'none';
        if (chatForm) chatForm.style.display = 'none';
        postOracleMessage(`<span style="color: #22c55e; font-weight: 800;">🎉 VICTORY! You outsmarted the 20-Neuron deduction matrix!</span> Type your prompt below to extract raw Oracle wisdom.`);
        if (oracleWishBox) oracleWishBox.style.display = 'block';
    }

    function handleOracleVictory(guessedConcept = "WaZ Weather / PourReady Estimator") {
        if (choiceBox) choiceBox.style.display = 'none';
        if (chatForm) chatForm.style.display = 'none';
        postOracleMessage(`<div style="text-align: center;">
            <div style="font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase;">🎯 DEDUCTION COMPLETE — 96.4% MATCH</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #ffffff; margin: 8px 0;">"Your secret concept is <u>${guessedConcept}</u>!"</div>
        </div>`);
        if (oracleWinBox) oracleWinBox.style.display = 'block';
    }

    if (grantWishBtn) {
        grantWishBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const promptVal = wishInput ? wishInput.value.trim() : '';
            if (promptVal && wishOutput) {
                wishOutput.style.display = 'block';
                wishOutput.innerHTML = `<strong>✨ Oracle Wisdom:</strong> "Regarding '<i>${promptVal}</i>': Concept synthesized via Zero-Liability Architecture (ZLA) & Cloudflare Workers AI edge processing."`;
            }
        });
    }
});
