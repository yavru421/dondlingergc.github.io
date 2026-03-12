const STORAGE_KEY = "jobsite-calculator-state-v1";
const TOOL_LABELS = {
    tape: "Tape Math",
    spacing: "Equal Spacing",
    concrete: "Concrete",
    stairs: "Stairs",
    board: "Board Feet"
};

class Fraction {
    constructor(numerator, denominator = 1n) {
        if (denominator === 0n) {
            throw new Error("Division by zero");
        }

        let n = BigInt(numerator);
        let d = BigInt(denominator);

        if (d < 0n) {
            n = -n;
            d = -d;
        }

        const divisor = Fraction.gcd(n, d);
        this.n = n / divisor;
        this.d = d / divisor;
    }

    static gcd(a, b) {
        let x = a < 0n ? -a : a;
        let y = b < 0n ? -b : b;
        while (y !== 0n) {
            const next = x % y;
            x = y;
            y = next;
        }
        return x || 1n;
    }

    static from(value) {
        return value instanceof Fraction ? value : new Fraction(value, 1n);
    }

    static fromRounded(number, denominator) {
        const scale = BigInt(denominator);
        return new Fraction(BigInt(Math.round(number * Number(scale))), scale);
    }

    add(other) {
        const value = Fraction.from(other);
        return new Fraction(this.n * value.d + value.n * this.d, this.d * value.d);
    }

    sub(other) {
        const value = Fraction.from(other);
        return new Fraction(this.n * value.d - value.n * this.d, this.d * value.d);
    }

    mul(other) {
        const value = Fraction.from(other);
        return new Fraction(this.n * value.n, this.d * value.d);
    }

    div(other) {
        const value = Fraction.from(other);
        if (value.n === 0n) {
            throw new Error("Division by zero");
        }
        return new Fraction(this.n * value.d, this.d * value.n);
    }

    abs() {
        return new Fraction(this.n < 0n ? -this.n : this.n, this.d);
    }

    negate() {
        return new Fraction(-this.n, this.d);
    }

    isZero() {
        return this.n === 0n;
    }

    toNumber() {
        return Number(this.n) / Number(this.d);
    }
}

const modeButtons = [...document.querySelectorAll("[data-mode]")];
const toolCards = [...document.querySelectorAll(".tool-card")];
const resultNodes = Object.fromEntries([...document.querySelectorAll("[data-result]")].map((node) => [node.dataset.result, node]));
const metaNodes = Object.fromEntries([...document.querySelectorAll("[data-meta]")].map((node) => [node.dataset.meta, node]));
const fields = [...document.querySelectorAll("[data-field]")];
const summaryMode = document.getElementById("summaryMode");
const summaryValue = document.getElementById("summaryValue");
const summarySub = document.getElementById("summarySub");
const summaryDetails = document.getElementById("summaryDetails");
const connectionPill = document.getElementById("connectionPill");
const installButton = document.getElementById("installPwaBtn");
const updateBanner = document.getElementById("updateBanner");
const updateButton = document.getElementById("updateBtn");
const copyResultButton = document.getElementById("copyResultBtn");
const shareResultButton = document.getElementById("shareResultBtn");
const iosBanner = document.getElementById("iosBanner");
const closeIosBanner = document.getElementById("closeIosBanner");
const toast = document.getElementById("toast");

let deferredPrompt = null;
let registrationRef = null;
let toastTimer = null;
let activeTool = "tape";
let lastSummaryText = "";
const savedState = restoreState();

function restoreState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { values: {}, activeTool: "tape" };
    } catch {
        return { values: {}, activeTool: "tape" };
    }
}

function readFieldValues() {
    return Object.fromEntries(fields.map((field) => [field.dataset.field, field.value]));
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ values: readFieldValues(), activeTool }));
}

function normalizeValue(value) {
    return value
        .trim()
        .replace(/[–—]/g, "-")
        .replace(/[×x]/g, "*")
        .replace(/÷/g, "/")
        .replace(/\s+/g, " ");
}

function parseSimpleNumber(raw) {
    const value = normalizeValue(String(raw)).replace(/,/g, "");
    if (!value) {
        throw new Error("Missing value");
    }

    let match = value.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
    if (match) {
        const whole = BigInt(match[1]);
        const numerator = BigInt(match[2]);
        const denominator = BigInt(match[3]);
        const sign = whole < 0n ? -1n : 1n;
        return new Fraction(whole, 1n).add(new Fraction(sign * numerator, denominator));
    }

    match = value.match(/^(-?\d+)-(\d+)\/(\d+)$/);
    if (match) {
        const whole = BigInt(match[1]);
        const numerator = BigInt(match[2]);
        const denominator = BigInt(match[3]);
        const sign = whole < 0n ? -1n : 1n;
        return new Fraction(whole, 1n).add(new Fraction(sign * numerator, denominator));
    }

    match = value.match(/^(-?\d+)\/(\d+)$/);
    if (match) {
        return new Fraction(BigInt(match[1]), BigInt(match[2]));
    }

    match = value.match(/^(-?\d+)(?:\.(\d+))?$/);
    if (match) {
        const integerPart = match[1];
        const decimalPart = match[2] || "";
        if (!decimalPart) {
            return new Fraction(BigInt(integerPart), 1n);
        }
        const digits = `${integerPart.replace("-", "")}${decimalPart}`;
        const scale = 10n ** BigInt(decimalPart.length);
        const signed = BigInt(integerPart.startsWith("-") ? `-${digits}` : digits);
        return new Fraction(signed, scale);
    }

    throw new Error("Invalid number");
}

function parseMeasurement(raw) {
    const value = normalizeValue(String(raw))
        .replace(/\s*(ft|feet)\s*/gi, "'")
        .replace(/\s*(in|inch|inches)\s*/gi, '"');

    if (!value) {
        throw new Error("Missing measurement");
    }

    if (value.includes("'") || value.includes('"')) {
        let feet = new Fraction(0n, 1n);
        let inches = new Fraction(0n, 1n);
        let remaining = value;

        const footIndex = remaining.indexOf("'");
        if (footIndex >= 0) {
            const feetPart = remaining.slice(0, footIndex).trim();
            if (feetPart) {
                feet = parseSimpleNumber(feetPart);
            }
            remaining = remaining.slice(footIndex + 1);
        }

        remaining = remaining.replace(/"/g, "").trim();
        if (remaining) {
            inches = parseSimpleNumber(remaining);
        }

        return feet.mul(12).add(inches);
    }

    return parseSimpleNumber(value);
}

function tokenizeExpression(raw) {
    const value = normalizeValue(raw).replace(/\s+/g, "");
    const tokens = value.match(/\d+-\d+\/\d+|\d+\/\d+|\d+\.\d+|\d+|[()+\-*/]/g);
    if (!tokens || tokens.join("") !== value) {
        throw new Error("Invalid expression");
    }
    return tokens;
}

function evaluateExpression(raw) {
    const tokens = tokenizeExpression(raw);
    let index = 0;

    function peek() {
        return tokens[index];
    }

    function next() {
        const token = tokens[index];
        index += 1;
        return token;
    }

    function parseFactor() {
        const token = peek();
        if (!token) {
            throw new Error("Unexpected end of expression");
        }

        if (token === "+") {
            next();
            return parseFactor();
        }

        if (token === "-") {
            next();
            return parseFactor().negate();
        }

        if (token === "(") {
            next();
            const value = parseExpressionInner();
            if (next() !== ")") {
                throw new Error("Missing closing parenthesis");
            }
            return value;
        }

        next();
        return parseSimpleNumber(token);
    }

    function parseTerm() {
        let value = parseFactor();
        while (peek() === "*" || peek() === "/") {
            const operator = next();
            const right = parseFactor();
            value = operator === "*" ? value.mul(right) : value.div(right);
        }
        return value;
    }

    function parseExpressionInner() {
        let value = parseTerm();
        while (peek() === "+" || peek() === "-") {
            const operator = next();
            const right = parseTerm();
            value = operator === "+" ? value.add(right) : value.sub(right);
        }
        return value;
    }

    const result = parseExpressionInner();
    if (index !== tokens.length) {
        throw new Error("Unexpected token");
    }
    return result;
}

function formatMixedFraction(value, precision = 16) {
    const fraction = value instanceof Fraction ? value : new Fraction(value, 1n);
    if (fraction.isZero()) {
        return "0";
    }

    let display = fraction.abs();
    if (display.d > 128n) {
        display = Fraction.fromRounded(display.toNumber(), precision);
    }

    const sign = fraction.n < 0n ? "-" : "";
    const whole = display.n / display.d;
    const remainder = display.n % display.d;

    if (remainder === 0n) {
        return `${sign}${whole.toString()}`;
    }

    if (whole === 0n) {
        return `${sign}${remainder.toString()}/${display.d.toString()}`;
    }

    return `${sign}${whole.toString()}-${remainder.toString()}/${display.d.toString()}`;
}

function formatFeetInches(totalInches) {
    const fraction = totalInches instanceof Fraction ? totalInches : new Fraction(totalInches, 1n);
    const sign = fraction.n < 0n ? "-" : "";
    const absolute = fraction.abs();
    const feet = Math.floor(absolute.toNumber() / 12);

    if (feet <= 0) {
        return `${sign}${formatMixedFraction(absolute)}"`;
    }

    const inches = absolute.sub(new Fraction(BigInt(feet * 12), 1n));
    return `${sign}${feet}' ${formatMixedFraction(inches)}"`;
}

function formatDecimal(value, digits = 4) {
    return value.toNumber().toFixed(digits);
}

function formatError(message) {
    return {
        value: message,
        sub: "Check the input and keep typing.",
        details: [],
        isError: true,
        text: message
    };
}

function calculateTape(values) {
    const input = values["tape.expression"] || "";
    if (!input.trim()) {
        return formatError("Type an expression");
    }

    try {
        const result = evaluateExpression(input);
        const exact = `${formatMixedFraction(result)}"`;
        return {
            value: exact,
            sub: `${formatDecimal(result)} decimal inches`,
            details: [
                `Expression: ${input}`,
                `Rounded to 1/16: ${formatMixedFraction(Fraction.fromRounded(result.toNumber(), 16))}"`,
                `Feet + inches: ${formatFeetInches(result)}`
            ],
            text: `${input} = ${exact}`
        };
    } catch (error) {
        return formatError(error.message);
    }
}

function calculateSpacing(values) {
    try {
        const total = parseMeasurement(values["spacing.total"] || "");
        const count = Number(values["spacing.count"]);
        if (!Number.isFinite(count) || count <= 0) {
            throw new Error("Enter a space count");
        }

        const spacing = total.div(new Fraction(BigInt(Math.round(count)), 1n));
        return {
            value: `${formatMixedFraction(spacing)}"`,
            sub: `${count} equal spaces across ${formatFeetInches(total)}`,
            details: [
                `On-center spacing: ${formatFeetInches(spacing)}`,
                `Decimal spacing: ${formatDecimal(spacing)} in`,
                `Total run: ${formatFeetInches(total)}`
            ],
            text: `Equal spacing for ${formatFeetInches(total)} across ${count} spaces is ${formatMixedFraction(spacing)}"`
        };
    } catch (error) {
        return formatError(error.message);
    }
}

function calculateConcrete(values) {
    try {
        const length = parseSimpleNumber(values["concrete.length"] || "").toNumber();
        const width = parseSimpleNumber(values["concrete.width"] || "").toNumber();
        const thicknessInches = parseSimpleNumber(values["concrete.thickness"] || "").toNumber();
        const quantity = Number(values["concrete.qty"] || 1);

        if (![length, width, thicknessInches, quantity].every((value) => Number.isFinite(value) && value > 0)) {
            throw new Error("Use positive dimensions");
        }

        const cubicFeet = length * width * (thicknessInches / 12) * quantity;
        const cubicYards = cubicFeet / 27;
        const bags80 = Math.ceil(cubicFeet / 0.6);

        return {
            value: `${cubicYards.toFixed(2)} yd3`,
            sub: `${cubicFeet.toFixed(2)} cubic feet total`,
            details: [
                `${quantity} pour${quantity === 1 ? "" : "s"} at ${length} ft x ${width} ft x ${thicknessInches} in`,
                `80 lb bags: about ${bags80}`,
                `Waste note: add 5% to 10% for ordering`
            ],
            text: `Concrete volume is ${cubicYards.toFixed(2)} cubic yards`
        };
    } catch (error) {
        return formatError(error.message);
    }
}

function calculateStairs(values) {
    try {
        const rise = parseMeasurement(values["stairs.rise"] || "");
        const maxRiser = parseMeasurement(values["stairs.maxRiser"] || "");
        const tread = parseMeasurement(values["stairs.tread"] || "");

        const riseNumber = rise.toNumber();
        const maxRiserNumber = maxRiser.toNumber();
        const treadNumber = tread.toNumber();

        if (![riseNumber, maxRiserNumber, treadNumber].every((value) => Number.isFinite(value) && value > 0)) {
            throw new Error("Use positive dimensions");
        }

        const risers = Math.ceil(riseNumber / maxRiserNumber);
        const exactRise = rise.div(new Fraction(BigInt(risers), 1n));
        const treads = Math.max(risers - 1, 1);
        const totalRun = tread.mul(new Fraction(BigInt(treads), 1n));

        return {
            value: `${risers} risers`,
            sub: `${formatMixedFraction(exactRise)}" exact rise`,
            details: [
                `Treads: ${treads}`,
                `Total run: ${formatFeetInches(totalRun)}`,
                `Total rise: ${formatFeetInches(rise)}`
            ],
            text: `Stair layout needs ${risers} risers at ${formatMixedFraction(exactRise)} inches each`
        };
    } catch (error) {
        return formatError(error.message);
    }
}

function calculateBoard(values) {
    try {
        const thickness = parseSimpleNumber(values["board.thickness"] || "").toNumber();
        const width = parseSimpleNumber(values["board.width"] || "").toNumber();
        const length = parseSimpleNumber(values["board.length"] || "").toNumber();
        const quantity = Number(values["board.qty"] || 1);

        if (![thickness, width, length, quantity].every((value) => Number.isFinite(value) && value > 0)) {
            throw new Error("Use positive dimensions");
        }

        const boardFeet = (thickness * width * length * quantity) / 12;
        const linearFeet = length * quantity;

        return {
            value: `${boardFeet.toFixed(2)} bd ft`,
            sub: `${quantity} pieces at ${thickness} x ${width} x ${length}`,
            details: [
                `Linear feet: ${linearFeet.toFixed(2)}`,
                `Each piece: ${((thickness * width * length) / 12).toFixed(2)} bd ft`,
                `Nominal stock can differ from actual dimensions`
            ],
            text: `Board footage totals ${boardFeet.toFixed(2)} board feet`
        };
    } catch (error) {
        return formatError(error.message);
    }
}

const calculators = {
    tape: calculateTape,
    spacing: calculateSpacing,
    concrete: calculateConcrete,
    stairs: calculateStairs,
    board: calculateBoard
};

function renderTool(tool, output) {
    const resultNode = resultNodes[tool];
    const metaNode = metaNodes[tool];
    resultNode.textContent = output.value;
    metaNode.textContent = output.sub;
    resultNode.classList.toggle("is-error", !!output.isError);
    metaNode.classList.toggle("is-error", !!output.isError);
}

function updateSummary(tool, output) {
    summaryMode.textContent = TOOL_LABELS[tool];
    summaryValue.textContent = output.value;
    summarySub.textContent = output.sub;
    summaryValue.classList.toggle("is-error", !!output.isError);
    summarySub.classList.toggle("is-error", !!output.isError);
    summaryDetails.replaceChildren();

    for (const line of output.details) {
        const item = document.createElement("li");
        item.textContent = line;
        summaryDetails.appendChild(item);
    }

    lastSummaryText = output.text || `${TOOL_LABELS[tool]}: ${output.value}`;
}

function updateAll() {
    const values = readFieldValues();
    const outputs = {};

    for (const [tool, calculator] of Object.entries(calculators)) {
        outputs[tool] = calculator(values);
        renderTool(tool, outputs[tool]);
    }

    updateSummary(activeTool, outputs[activeTool]);
    saveState();
}

function setActiveTool(tool) {
    activeTool = tool;
    for (const button of modeButtons) {
        button.classList.toggle("is-active", button.dataset.mode === tool);
    }
    for (const card of toolCards) {
        card.classList.toggle("is-active", card.dataset.tool === tool);
    }
    // Sync tab UI (defined in index.html inline script)
    if (typeof window._activateTab === "function") {
        window._activateTab(tool);
    }
    updateAll();
}

// Expose for tab buttons defined in HTML
window._setActiveTool = setActiveTool;

function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        toast.hidden = true;
    }, 2200);
}

async function copyText(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const success = document.execCommand("copy");
    document.body.removeChild(area);
    return success;
}

async function shareText(text) {
    if (navigator.share) {
        await navigator.share({ title: "Jobsite Calculator", text });
        return true;
    }
    return copyText(text);
}

function triggerHaptic(pattern = 10) {
    if ("vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}

function updateConnection() {
    const online = navigator.onLine;
    connectionPill.textContent = online ? "Online" : "Offline";
    connectionPill.classList.toggle("is-online", online);
    connectionPill.classList.toggle("is-offline", !online);
}

function shouldShowIosBanner() {
    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
    const isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    return isIos && isSafari && !isStandalone;
}

async function setupPwa() {
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredPrompt = event;
        installButton.hidden = false;
    });

    installButton.addEventListener("click", async () => {
        if (!deferredPrompt) {
            return;
        }
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        installButton.hidden = true;
        triggerHaptic([12]);
    });

    window.addEventListener("appinstalled", () => {
        installButton.hidden = true;
        iosBanner.hidden = true;
        showToast("Installed");
    });

    if (shouldShowIosBanner()) {
        iosBanner.hidden = false;
    }

    closeIosBanner.addEventListener("click", () => {
        iosBanner.hidden = true;
    });

    if ("wakeLock" in navigator) {
        let wakeLock = null;
        const requestWakeLock = async () => {
            try {
                wakeLock = await navigator.wakeLock.request("screen");
                wakeLock.addEventListener("release", () => {
                    wakeLock = null;
                });
            } catch {
                wakeLock = null;
            }
        };

        await requestWakeLock();
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible" && !wakeLock) {
                requestWakeLock();
            }
        });
    }

    if ("serviceWorker" in navigator) {
        try {
            registrationRef = await navigator.serviceWorker.register("service-worker.js");

            if (registrationRef.waiting) {
                updateBanner.hidden = false;
            }

            registrationRef.addEventListener("updatefound", () => {
                const worker = registrationRef.installing;
                if (!worker) {
                    return;
                }
                worker.addEventListener("statechange", () => {
                    if (worker.state === "installed" && navigator.serviceWorker.controller) {
                        updateBanner.hidden = false;
                    }
                });
            });

            navigator.serviceWorker.addEventListener("controllerchange", () => {
                window.location.reload();
            });
        } catch {
            // The app still works online without service worker registration.
        }
    }

    updateButton.addEventListener("click", () => {
        registrationRef?.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
}

for (const field of fields) {
    const savedValue = savedState.values?.[field.dataset.field];
    if (savedValue !== undefined) {
        field.value = savedValue;
    }

    field.addEventListener("input", () => {
        setActiveTool(field.dataset.toolInput);
    });

    field.addEventListener("focus", () => {
        setActiveTool(field.dataset.toolInput);
    });
}

for (const button of modeButtons) {
    button.addEventListener("click", () => {
        const tool = button.dataset.mode;
        setActiveTool(tool);
        document.getElementById(`tool-${tool}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
}

for (const card of toolCards) {
    card.addEventListener("click", () => {
        setActiveTool(card.dataset.tool);
    });
}

for (const button of document.querySelectorAll("[data-example='tape']")) {
    button.addEventListener("click", () => {
        document.getElementById("tapeExpression").value = button.dataset.value;
        setActiveTool("tape");
        showToast("Example loaded");
    });
}

copyResultButton.addEventListener("click", async () => {
    const success = await copyText(lastSummaryText);
    if (success) {
        triggerHaptic([16]);
        showToast("Copied");
    }
});

shareResultButton.addEventListener("click", async () => {
    try {
        await shareText(lastSummaryText);
        showToast("Shared");
    } catch {
        showToast("Share unavailable");
    }
});

activeTool = savedState.activeTool && calculators[savedState.activeTool] ? savedState.activeTool : "tape";
setActiveTool(activeTool);
setupPwa();

window.jobsiteCalculator = {
    copyText,
    shareText,
    triggerHaptic
};
