/**
 * Voice Module — Always-On Global Service.
 *
 * Provides:
 * - Continuous speech recognition across all steps
 * - Fuzzy matching for voice commands (levenshtein ≤ 3)
 * - TTS with navBlockedUntil echo prevention (900ms)
 * - Step-specific command routing
 * - Voice bar UI updates
 * - Suppression during driving simulator stages
 *
 * Factory: createVoiceService({ bus, controller, steps }) → service object
 *
 * Legacy exports (isVoiceSupported, requestMicPermission, startRecognition)
 * are preserved as compatibility shims for the profile step in onboarding.js.
 */

// ═══════════════════════════════════════════
//  LEVENSHTEIN DISTANCE & FUZZY MATCHING
// ═══════════════════════════════════════════

/**
 * Compute the Levenshtein edit distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
            );
        }
    }
    return dp[m][n];
}

/**
 * Fuzzy match an input string against a list of candidates.
 * Returns the best match if within threshold, or null.
 * @param {string} input
 * @param {string[]} candidates
 * @param {number} [threshold=3]
 * @returns {string|null}
 */
export function fuzzyMatch(input, candidates, threshold = 3) {
    input = input.toLowerCase().trim();
    let bestMatch = null, bestDist = Infinity;
    for (const candidate of candidates) {
        // Exact substring match — immediate return
        if (input.includes(candidate)) return candidate;
        const dist = levenshtein(input, candidate);
        if (dist < bestDist) { bestDist = dist; bestMatch = candidate; }
    }
    return bestDist <= threshold ? bestMatch : null;
}

// ═══════════════════════════════════════════
//  VOICE MESSAGES PER STEP
// ═══════════════════════════════════════════

const voiceMessages = {
    'onboarding.profile': "Welcome to AeroDrive. Let's create your profile. Tap the microphone, or say next when you're ready.",
    'onboarding.comfort': "Now let's get you comfortable. Tap the seat zones to adjust your position, or say the zone name like headrest or lumbar.",
    'onboarding.locations': "Set your frequent destinations. You can say next when you're done.",
    'onboarding.drive-explained': "This section explains how your car drives. The take-over section is critical — please review it carefully.",
    'onboarding.takeover-drill': "Time to practice. When the warning appears, press and hold the override button. Say next when complete.",
    'onboarding.preferences': "Final step. Tune how the AI drives with the sliders. Say complete or finish when you're happy.",
};

// ═══════════════════════════════════════════
//  NAVIGATION COMMANDS
// ═══════════════════════════════════════════

const NAV_NEXT = ['next', 'continue', 'skip', 'proceed', 'forward', 'go ahead', 'move on'];
const NAV_BACK = ['back', 'previous', 'go back', 'return'];
const NAV_COMPLETE = ['complete', 'finish', 'done'];

// Step-specific commands
const COMFORT_ZONES = ['headrest', 'backrest', 'lumbar', 'cushion'];
const LEARN_SLIDES = { 'capabilities': 1, 'safety': 2, 'charging': 3, 'takeover': 4, 'take over': 4 };

// ═══════════════════════════════════════════
//  VOICE SERVICE FACTORY
// ═══════════════════════════════════════════

/**
 * Create the always-on voice service.
 * @param {{ bus: object, controller: object, steps: object[] }} deps
 */
export function createVoiceService({ bus, controller, steps }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // State
    let isListening = false;
    let isSuppressed = false;
    let recognition = null;
    let navBlockedUntil = 0;
    let lastCommandTime = 0;
    const COMMAND_COOLDOWN = 1500;
    const NAV_BLOCK_DURATION = 900;

    // UI elements
    const voiceBar = document.getElementById('voice-bar');
    const micToggle = document.getElementById('mic-toggle');
    const voiceText = document.getElementById('voice-text');
    const voiceHeard = document.getElementById('voice-heard');
    const speakerIcon = document.getElementById('speaker-icon');

    // Step-specific command handlers registered by step modules
    const stepCommandHandlers = new Map();

    // ── TTS ──────────────────────────────────────────────────────────────

    /**
     * Speak text via TTS with voice selection and echo prevention.
     * @param {string} text
     */
    function speak(text) {
        if (isSuppressed) return;
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.95;
        u.pitch = 1.0;
        u.volume = 1;

        const voices = window.speechSynthesis.getVoices();
        const pref = voices.find(v =>
            v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Google')
        );
        if (pref) u.voice = pref;

        // Update voice bar to speaking state
        if (voiceBar) voiceBar.classList.add('speaking');
        if (voiceText) voiceText.textContent = text;

        const clearSpeaking = () => {
            if (voiceBar) voiceBar.classList.remove('speaking');
            navBlockedUntil = Date.now() + NAV_BLOCK_DURATION;
        };
        u.onend = clearSpeaking;
        u.onerror = clearSpeaking;

        window.speechSynthesis.speak(u);
    }

    // ── RECOGNITION ──────────────────────────────────────────────────────

    function initRecognition() {
        if (!SpeechRecognition) return;

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript.trim().toLowerCase();
                const isFinal = result.isFinal;

                // Update heard text in voice bar
                if (voiceHeard) voiceHeard.textContent = `"${transcript}"`;

                // Process command
                const handled = handleVoiceCommand(transcript, isFinal);

                // If handled on interim, stop and restart to flush buffer
                if (handled && !isFinal) {
                    try { recognition.stop(); } catch { /* */ }
                    break;
                }
            }
        };

        recognition.onerror = (e) => {
            if (e.error === 'no-speech' || e.error === 'aborted') return;
            // eslint-disable-next-line no-console
            console.warn('[voice] recognition error:', e.error);
        };

        recognition.onend = () => {
            // Auto-restart if still supposed to be listening
            if (isListening && !isSuppressed) {
                try { recognition.start(); } catch { /* */ }
            }
        };
    }

    function startListening() {
        if (!SpeechRecognition) {
            if (voiceText) voiceText.textContent = 'Voice not supported in this browser';
            return;
        }
        if (!recognition) initRecognition();
        if (!recognition) return;

        isListening = true;
        try { recognition.start(); } catch { /* already started */ }

        if (micToggle) {
            micToggle.classList.add('listening');
            micToggle.setAttribute('aria-pressed', 'true');
        }
        if (voiceText) voiceText.textContent = 'Listening... try "next", "back", or zone names';
    }

    function stopListening() {
        isListening = false;
        if (recognition) {
            try { recognition.stop(); } catch { /* */ }
        }
        if (micToggle) {
            micToggle.classList.remove('listening');
            micToggle.setAttribute('aria-pressed', 'false');
        }
        if (voiceText) voiceText.textContent = 'Mic off — tap to listen';
        if (voiceHeard) voiceHeard.textContent = '';
    }

    function toggleMic() {
        if (isSuppressed) return;
        if (isListening) stopListening();
        else startListening();
    }

    // ── COMMAND HANDLING ─────────────────────────────────────────────────

    function handleVoiceCommand(transcript, isFinal) {
        if (isSuppressed) return false;

        const now = Date.now();
        if (now - lastCommandTime < COMMAND_COOLDOWN) return false;

        const words = transcript.toLowerCase();

        // Navigation commands — check navBlockedUntil for echo prevention
        const matchedNext = fuzzyMatch(words, NAV_NEXT);
        const matchedBack = fuzzyMatch(words, NAV_BACK);
        const matchedComplete = fuzzyMatch(words, NAV_COMPLETE);
        const wantsFwdNav = !!(matchedNext || matchedComplete);

        if ((wantsFwdNav || matchedBack) && now < navBlockedUntil) return false;

        if (matchedNext) {
            lastCommandTime = now;
            controller.advance('voice-next');
            return true;
        }
        if (matchedBack) {
            lastCommandTime = now;
            controller.retreat('voice-back');
            return true;
        }
        if (matchedComplete) {
            lastCommandTime = now;
            // On preferences step, "complete" acts as advance
            controller.advance('voice-complete');
            return true;
        }

        // Step-specific commands
        const currentStep = steps[controller.getActiveIndex()];
        if (currentStep) {
            const handled = handleStepSpecificCommand(currentStep, words);
            if (handled) {
                lastCommandTime = now;
                return true;
            }
        }

        return false;
    }

    function handleStepSpecificCommand(step, words) {
        // Comfort step: zone names
        if (step.id === 'onboarding.comfort') {
            const match = fuzzyMatch(words, COMFORT_ZONES);
            if (match) {
                bus.emit('voiceCommand', { type: 'zone', value: match, stepId: step.id });
                return true;
            }
        }

        // Drive explained step: slide names
        if (step.id === 'onboarding.drive-explained') {
            for (const [key, slideNum] of Object.entries(LEARN_SLIDES)) {
                if (words.includes(key) || fuzzyMatch(words, [key])) {
                    bus.emit('voiceCommand', { type: 'slide', value: slideNum, stepId: step.id });
                    return true;
                }
            }
        }

        // Preferences step: complete/finish/done already handled above as NAV_COMPLETE

        // Check registered step command handlers
        const handler = stepCommandHandlers.get(step.id);
        if (handler) {
            return handler(words);
        }

        return false;
    }

    // ── SUPPRESSION ──────────────────────────────────────────────────────

    function suppress() {
        isSuppressed = true;
        if (recognition && isListening) {
            try { recognition.stop(); } catch { /* */ }
        }
        // Cancel any ongoing TTS
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (voiceBar) voiceBar.classList.add('suppressed');
        if (voiceText) voiceText.textContent = 'Voice paused — driving mode';
    }

    function unsuppress() {
        isSuppressed = false;
        if (voiceBar) voiceBar.classList.remove('suppressed');
        if (isListening) {
            try { recognition.start(); } catch { /* */ }
            if (voiceText) voiceText.textContent = 'Listening... try "next", "back", or zone names';
        }
    }

    // ── STEP CHANGE HANDLING ─────────────────────────────────────────────

    function onStepChange({ step }) {
        // Suppress during driving/riding stages (Req 3.10)
        const suppressedStages = ['driving', 'riding'];
        if (suppressedStages.includes(step.stage)) {
            suppress();
        } else if (isSuppressed && !suppressedStages.includes(step.stage)) {
            unsuppress();
        }

        // Speak step message if available
        const msg = voiceMessages[step.id];
        if (msg && !isSuppressed) {
            // Small delay so the transition animation completes first
            setTimeout(() => speak(msg), 400);
        }
    }

    // ── PUBLIC API ───────────────────────────────────────────────────────

    /**
     * Register a custom command handler for a specific step.
     * @param {string} stepId
     * @param {(words: string) => boolean} handler
     */
    function registerStepHandler(stepId, handler) {
        stepCommandHandlers.set(stepId, handler);
    }

    /**
     * Unregister a step command handler.
     * @param {string} stepId
     */
    function unregisterStepHandler(stepId) {
        stepCommandHandlers.delete(stepId);
    }

    // ── INITIALIZATION ───────────────────────────────────────────────────

    // Wire mic toggle button
    if (micToggle) {
        micToggle.addEventListener('click', toggleMic);
    }

    // Subscribe to step changes
    bus.on('stepDidChange', onStepChange);

    // Auto-start recognition on boot
    startListening();

    return {
        speak,
        toggleMic,
        startListening,
        stopListening,
        suppress,
        unsuppress,
        registerStepHandler,
        unregisterStepHandler,
        isListening: () => isListening,
        isSuppressed: () => isSuppressed,
    };
}

// ═══════════════════════════════════════════
//  LEGACY COMPATIBILITY SHIMS
// ═══════════════════════════════════════════
// These exports are used by the profile step in onboarding.js.
// They delegate to standalone implementations that work independently
// of the global voice service (for the profile mic-capture flow).

export function isVoiceSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export async function requestMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { ok: false, reason: 'no-mediadevices' };
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        return { ok: true };
    } catch (err) {
        return { ok: false, reason: err.name || 'denied' };
    }
}

/**
 * Start recognition session (legacy API for profile step).
 * Returns an object with `stop()`.
 */
export function startRecognition({ onInterim, onFinal, onError } = {}) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        onError && onError(new Error('SpeechRecognition not supported'));
        return { stop: () => { } };
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    let stopped = false;

    rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const r = event.results[i];
            const t = r[0].transcript.trim();
            if (!r.isFinal) onInterim && onInterim(t);
            else onFinal && onFinal(t);
        }
    };
    rec.onerror = (e) => {
        if (!stopped && e.error !== 'aborted' && e.error !== 'no-speech') {
            onError && onError(e);
        }
    };
    rec.onend = () => {
        if (!stopped) {
            try { rec.start(); } catch { /* */ }
        }
    };

    try { rec.start(); } catch (err) { onError && onError(err); }

    return {
        stop: () => {
            stopped = true;
            try { rec.stop(); } catch { /* */ }
        },
    };
}
