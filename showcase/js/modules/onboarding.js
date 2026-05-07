/**
 * Onboarding module — six improved onboarding steps.
 * See design.md "Onboarding Steps 1–6" and requirements Req 8.
 *
 * Every step is voice-capable (Req 8.6) but always exposes an equivalent
 * on-screen control so the Presenter can advance without voice input.
 * Each step declares at least one Trust_Moment (Req 8.7).
 */

import { isVoiceSupported, requestMicPermission, startRecognition } from '../core/voice.js';

const ONBOARDING_TITLES = {
    profile: 'Meet your driver',
    comfort: 'Calibrate the cabin',
    locations: 'Set your places',
    'drive-explained': 'How your drive works',
    'takeover-drill': 'Practice the hand-over',
    preferences: 'Dial in your drive',
};

const ONBOARDING_PURPOSES = {
    profile: 'Register a face and a voice so your AeroDrive knows who is driving.',
    comfort: 'Shape the seat, mirrors, and climate to exactly what you like.',
    locations: 'Pin the places you drive to most so routes set themselves.',
    'drive-explained': 'Four screens that explain how autonomous handoffs work.',
    'takeover-drill': 'Rehearse the real take-over move so the first one is familiar.',
    preferences: 'Tune speed, following distance, and lane style to your comfort.',
};

const TRUST_MOMENTS_BY_STEP = {
    profile: [
        { id: 'onboarding.profile.consent', text: 'Camera only activates during biometric setup' },
    ],
    comfort: [
        { id: 'onboarding.comfort.local', text: 'Your seat profile is stored locally' },
    ],
    locations: [
        { id: 'onboarding.locations.scope', text: 'Only the presets you add are used for routing' },
    ],
    'drive-explained': [
        { id: 'onboarding.drive.limits', text: 'The car names its limits before it relies on you' },
    ],
    'takeover-drill': [
        { id: 'onboarding.takeover.practice', text: 'Practice handoff before you ever need one' },
    ],
    preferences: [
        { id: 'onboarding.prefs.control', text: 'Aggressiveness dials down whenever you say so' },
    ],
};

/** Render a cluster status with step-title + 6-segment progress pips. */
function renderClusterFor(slug, host) {
    const order = ['profile', 'comfort', 'locations', 'drive-explained', 'takeover-drill', 'preferences'];
    const LABELS = {
        profile: 'Profile',
        comfort: 'Comfort',
        locations: 'Locations',
        'drive-explained': 'Drive explained',
        'takeover-drill': 'Take-over drill',
        preferences: 'Preferences',
    };
    const idx = order.indexOf(slug);
    const pips = order.map((_, i) => {
        const cls = i < idx ? 'is-done' : i === idx ? 'is-current' : '';
        return `<span class="cluster-pip ${cls}"></span>`;
    }).join('');

    host.innerHTML = `
        <div class="cluster-title">
            <span class="t-caption cluster-context">Onboarding · ${LABELS[slug]} · Step ${idx + 1} of 6</span>
            <span class="cluster-autonomy">STATIONARY</span>
        </div>
        <h2 class="t-subhead" data-cluster-label>${ONBOARDING_TITLES[slug]}</h2>
        <p class="t-caption cluster-context" data-cluster-status>${LABELS[slug]} · IN PROGRESS</p>
        <div class="cluster-pips" aria-hidden="true">${pips}</div>
    `;
}

/**
 * Helper: render a brief completion pill on the tablet, then advance after 350ms.
 * Implements Req 8.5 (visible completion confirmation before next Step becomes active).
 */
function completeThenAdvance(host, controller, sourceTag) {
    const actions = host.querySelector('.step-actions');
    if (!actions) { controller.advance(sourceTag); return; }
    const pill = document.createElement('span');
    pill.className = 'is-complete';
    pill.setAttribute('role', 'status');
    pill.textContent = 'Done';
    actions.appendChild(pill);
    setTimeout(() => controller.advance(sourceTag), 350);
}

function tmShield(trustMoments) {
    const t = trustMoments[0];
    return t ? `<span class="trust-moment">${t.text}</span>` : '';
}

// ── Individual tablet renderers ────────────────────────────────────────

function renderProfileTablet(host, step, controller, bus) {
    let phase = 1; // 1=Name, 2=Face, 3=Voice
    let recSession = null;
    let capturedName = '';
    let scanningBlocked = false;
    let cameraStream = null;

    function capitalizeName(str) {
        return str.replace(/\b\w/g, c => c.toUpperCase());
    }

    function renderPhase() {
        const dotStates = [1, 2, 3].map(i => i < phase ? 'done' : i === phase ? 'active' : '');
        const dotsHTML = dotStates.map(s => `<span class="profile-dot ${s}"></span>`).join('');
        const ctaText = phase === 3 ? 'Complete Profile' : 'Next';

        let phaseContent = '';
        if (phase === 1) {
            phaseContent = `
                <div class="profile-phase phase-name">
                    <div class="mic-ring-container">
                        <button type="button" class="mic-ring-btn" data-mic-btn aria-label="Enable microphone">🎤</button>
                    </div>
                    <div class="phase-body">
                        <p class="phase-prompt" data-mic-prompt>Tap the mic, then say your name.</p>
                        <p class="t-caption cluster-context" data-mic-status>Biometric capture runs only while this step is open.</p>
                        <p class="t-mono phase-heard" data-mic-heard></p>
                        <div class="name-fields" data-name-fields style="display:none;">
                            <label class="name-field-label">Name<input type="text" class="name-field-input" data-field-name /></label>
                            <label class="name-field-label">Display Name<input type="text" class="name-field-input" data-field-display /></label>
                        </div>
                    </div>
                </div>`;
        } else if (phase === 2) {
            phaseContent = `
                <div class="profile-phase phase-face">
                    <div class="face-scanner">
                        <video autoplay playsinline muted class="face-video" data-face-video></video>
                        <div class="face-scanner-ring" data-scanner-ring></div>
                        <div class="face-checkmark hidden" data-face-check>✓</div>
                    </div>
                    <p class="phase-prompt" data-face-status>Requesting camera access…</p>
                </div>`;
        } else {
            phaseContent = `
                <div class="profile-phase phase-voice">
                    <p class="phase-prompt">Say the wake phrase:</p>
                    <p class="wake-phrase">"Hey AeroDrive, take me home"</p>
                    <div class="voice-waveform" data-waveform>
                        <span class="wave-bar"></span><span class="wave-bar"></span><span class="wave-bar"></span>
                        <span class="wave-bar"></span><span class="wave-bar"></span><span class="wave-bar"></span>
                        <span class="wave-bar"></span>
                    </div>
                    <p class="t-caption cluster-context" data-voice-status>Listening for wake phrase…</p>
                </div>`;
        }

        host.innerHTML = `
            <div class="tablet-step">
                <p class="t-caption step-meta">Onboarding · 1 / 6</p>
                <h2 class="step-title">${step.title}</h2>
                <p class="step-purpose">${ONBOARDING_PURPOSES.profile}</p>
                <div class="profile-progress-dots">${dotsHTML}</div>
                ${phaseContent}
                <div class="step-actions">
                    ${tmShield(step.trustMoments)}
                    <button type="button" role="button" class="btn btn-primary" data-cta="onboarding-advance">${ctaText}</button>
                </div>
            </div>
        `;

        // Wire phase-specific logic
        if (phase === 1) wirePhase1();
        else if (phase === 2) wirePhase2();
        else wirePhase3();

        host.querySelector('[data-cta="onboarding-advance"]').addEventListener('click', () => {
            // The CTA always completes the step (skips remaining phases)
            cleanup();
            completeThenAdvance(host, controller, 'onboarding-profile-cta');
        });
    }

    function wirePhase1() {
        const micBtn = host.querySelector('[data-mic-btn]');
        const promptEl = host.querySelector('[data-mic-prompt]');
        const statusEl = host.querySelector('[data-mic-status]');
        const heardEl = host.querySelector('[data-mic-heard]');
        const nameFields = host.querySelector('[data-name-fields]');
        const fieldName = host.querySelector('[data-field-name]');
        const fieldDisplay = host.querySelector('[data-field-display]');

        if (capturedName) {
            nameFields.style.display = 'flex';
            fieldName.value = capitalizeName(capturedName);
            fieldDisplay.value = capitalizeName(capturedName.split(' ')[0] || capturedName);
            promptEl.textContent = `Welcome, ${capitalizeName(capturedName)}!`;
        }

        async function activateMic() {
            if (recSession) return;
            if (!isVoiceSupported()) {
                statusEl.textContent = 'Voice not supported — type your name below.';
                nameFields.style.display = 'flex';
                return;
            }
            statusEl.textContent = 'Requesting microphone…';
            const perm = await requestMicPermission();
            if (!perm.ok) {
                statusEl.textContent = `Mic ${perm.reason}. Type your name instead.`;
                nameFields.style.display = 'flex';
                return;
            }
            micBtn.classList.add('is-listening');
            promptEl.textContent = 'Listening — say your name.';
            statusEl.textContent = '';
            recSession = startRecognition({
                onInterim: (t) => { heardEl.textContent = `"${t}"`; },
                onFinal: (t) => {
                    heardEl.textContent = `"${t}"`;
                    if (!capturedName) {
                        capturedName = t;
                        const capped = capitalizeName(capturedName);
                        promptEl.textContent = `Welcome, ${capped}!`;
                        nameFields.style.display = 'flex';
                        fieldName.value = capped;
                        fieldDisplay.value = capitalizeName(capturedName.split(' ')[0] || capturedName);
                        // TTS greeting
                        if ('speechSynthesis' in window) {
                            const u = new SpeechSynthesisUtterance(`Welcome, ${capped}. Let's set up your profile.`);
                            u.rate = 0.95;
                            window.speechSynthesis.speak(u);
                        }
                    }
                },
                onError: (e) => {
                    // 'aborted' and 'no-speech' are normal — don't show as errors
                    if (e.error === 'aborted' || e.error === 'no-speech') return;
                    statusEl.textContent = `Mic error: ${e.error || e.message || 'unknown'}. Type your name instead.`;
                    nameFields.style.display = 'flex';
                },
            });
        }
        micBtn.addEventListener('click', activateMic);
    }

    function wirePhase2() {
        const video = host.querySelector('[data-face-video]');
        const ring = host.querySelector('[data-scanner-ring]');
        const check = host.querySelector('[data-face-check]');
        const status = host.querySelector('[data-face-status]');
        scanningBlocked = true;

        async function startCamera() {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = cameraStream;
                status.textContent = 'Scanning face…';
                ring.classList.add('is-scanning');

                // Simulate scan (~3s)
                setTimeout(() => {
                    ring.classList.remove('is-scanning');
                    ring.classList.add('is-done');
                    check.classList.remove('hidden');
                    status.textContent = 'Face registered ✓';
                    scanningBlocked = false;
                    // HUD alert
                    const alertEl = document.getElementById('hud-alert');
                    const alertText = document.getElementById('hud-alert-text');
                    if (alertEl && alertText) {
                        alertText.textContent = 'Face Registered';
                        alertEl.classList.remove('hidden');
                        setTimeout(() => alertEl.classList.add('hidden'), 2500);
                    }
                    // Stop camera
                    if (cameraStream) {
                        cameraStream.getTracks().forEach(t => t.stop());
                        cameraStream = null;
                    }
                }, 3000);
            } catch (err) {
                status.textContent = 'Camera denied — skipping face scan.';
                video.style.display = 'none';
                ring.classList.add('is-done');
                check.classList.remove('hidden');
                check.textContent = '⚠';
                scanningBlocked = false;
            }
        }
        startCamera();
    }

    function wirePhase3() {
        const waveform = host.querySelector('[data-waveform]');
        const status = host.querySelector('[data-voice-status]');
        waveform.classList.add('is-active');

        // Simulate voice profile capture (~3.5s)
        setTimeout(() => {
            waveform.classList.remove('is-active');
            waveform.classList.add('is-done');
            status.textContent = 'Voice profile created ✓';
            // HUD alert
            const alertEl = document.getElementById('hud-alert');
            const alertText = document.getElementById('hud-alert-text');
            if (alertEl && alertText) {
                alertText.textContent = 'Voice Profile Created';
                alertEl.classList.remove('hidden');
                setTimeout(() => alertEl.classList.add('hidden'), 2500);
            }
        }, 3500);
    }

    function advancePhase() {
        if (phase === 2 && scanningBlocked) return; // gating: can't skip face scan
        if (recSession) { recSession.stop(); recSession = null; }
        if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }

        if (phase < 3) {
            phase++;
            renderPhase();
        } else {
            completeThenAdvance(host, controller, 'onboarding-profile-cta');
        }
    }

    // Voice "next" command advances sub-steps (but blocked during face scan)
    const offVoice = bus.on('voiceCommand', (ev) => {
        if (ev.type === 'nav-next' && ev.stepId === step.id) {
            advancePhase();
        }
    });
    const offCleanup = bus.on('stepWillChange', () => { offVoice(); offCleanup(); cleanup(); });

    function cleanup() {
        if (recSession) { recSession.stop(); recSession = null; }
        if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
    }

    renderPhase();
}

function renderComfortTablet(host, step, controller, bus) {
    const zones = ['headrest', 'backrest', 'lumbar', 'cushion'];
    const zoneLabels = { headrest: 'Headrest', backrest: 'Backrest', lumbar: 'Lumbar', cushion: 'Cushion' };
    const state = {
        activeZone: 'lumbar',
        height: { headrest: 5, backrest: 5, lumbar: 5, cushion: 5 },
        tilt: { headrest: 0, backrest: 0, lumbar: 0, cushion: 0 },
        temperature: 72,
        accentColor: '#2B4CFF',
    };

    const colors = ['#2B4CFF', '#FF6B35', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

    function selectZone(zone) {
        state.activeZone = zone;
        render();
        // HUD update
        const ctxLabel = document.getElementById('hud-context-label');
        if (ctxLabel) ctxLabel.textContent = `CABIN: ${zone.toUpperCase()}`;
        // Cockpit annotation
        const ann = document.getElementById('cockpit-annotation');
        if (ann) {
            ann.textContent = `Motor adjusting ${zoneLabels[zone]}`;
            ann.classList.add('annotation-action');
            setTimeout(() => {
                ann.textContent = 'AeroDrive Onboarding Active';
                ann.classList.remove('annotation-action');
            }, 3000);
        }
    }

    function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

    function adjustHeight(delta) {
        state.height[state.activeZone] = clamp(state.height[state.activeZone] + delta, 1, 10);
        render();
    }

    function adjustTilt(delta) {
        state.tilt[state.activeZone] = clamp(state.tilt[state.activeZone] + delta, -15, 15);
        render();
    }

    function adjustTemp(delta) {
        state.temperature = clamp(state.temperature + delta, 60, 85);
        render();
    }

    function setColor(color) {
        state.accentColor = color;
        document.documentElement.style.setProperty('--cabin-voice-accent', color);
        render();
    }

    function render() {
        const z = state.activeZone;
        const seatRotate = (state.tilt[z] * 0.3).toFixed(1);
        const seatScale = (0.9 + state.height[z] * 0.02).toFixed(2);

        const hotspotsHTML = zones.map(zone => `
            <button type="button" class="seat-hotspot ${zone === z ? 'is-active' : ''}" data-zone="${zone}" aria-label="Select ${zoneLabels[zone]} zone">
                ${zoneLabels[zone]}
            </button>
        `).join('');

        const colorsHTML = colors.map(c => `
            <button type="button" class="color-dot ${c === state.accentColor ? 'is-active' : ''}" data-color="${c}" style="background:${c};" aria-label="Set accent color ${c}"></button>
        `).join('');

        host.innerHTML = `
            <div class="tablet-step">
                <p class="t-caption step-meta">Onboarding · 2 / 6</p>
                <h2 class="step-title">${step.title}</h2>
                <p class="step-purpose">${ONBOARDING_PURPOSES.comfort}</p>
                <div class="comfort-layout">
                    <div class="seat-diagram-container">
                        <img src="assets/seat.png" alt="Seat diagram" class="seat-diagram-img" style="transform: rotate(${seatRotate}deg) scale(${seatScale});" />
                        <div class="seat-hotspots">${hotspotsHTML}</div>
                    </div>
                    <div class="zone-controls-panel">
                        <p class="zone-active-label">${zoneLabels[z]}</p>
                        <div class="zone-control-row">
                            <span class="zone-control-label">Height</span>
                            <button type="button" class="zone-btn" data-action="height-down">−</button>
                            <span class="zone-val" data-val="height">${state.height[z]}</span>
                            <button type="button" class="zone-btn" data-action="height-up">+</button>
                        </div>
                        <div class="zone-control-row">
                            <span class="zone-control-label">Tilt</span>
                            <button type="button" class="zone-btn" data-action="tilt-down">−</button>
                            <span class="zone-val" data-val="tilt">${state.tilt[z]}°</span>
                            <button type="button" class="zone-btn" data-action="tilt-up">+</button>
                        </div>
                        <div class="zone-control-row">
                            <span class="zone-control-label">Temp</span>
                            <button type="button" class="zone-btn" data-action="temp-down">−</button>
                            <span class="zone-val" data-val="temp">${state.temperature}°F</span>
                            <button type="button" class="zone-btn" data-action="temp-up">+</button>
                        </div>
                        <div class="color-picker-row">
                            <span class="zone-control-label">Ambient</span>
                            <div class="color-dots">${colorsHTML}</div>
                        </div>
                    </div>
                </div>
                <div class="step-actions">
                    ${tmShield(step.trustMoments)}
                    <button type="button" role="button" class="btn btn-primary" data-cta="onboarding-advance">Save cabin</button>
                </div>
            </div>
        `;

        // Wire events
        host.querySelectorAll('[data-zone]').forEach(btn => {
            btn.addEventListener('click', () => selectZone(btn.dataset.zone));
        });
        host.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const a = btn.dataset.action;
                if (a === 'height-up') adjustHeight(1);
                else if (a === 'height-down') adjustHeight(-1);
                else if (a === 'tilt-up') adjustTilt(1);
                else if (a === 'tilt-down') adjustTilt(-1);
                else if (a === 'temp-up') adjustTemp(1);
                else if (a === 'temp-down') adjustTemp(-1);
            });
        });
        host.querySelectorAll('[data-color]').forEach(btn => {
            btn.addEventListener('click', () => setColor(btn.dataset.color));
        });
        host.querySelector('[data-cta="onboarding-advance"]').addEventListener('click', () =>
            completeThenAdvance(host, controller, 'onboarding-comfort-cta')
        );
    }

    // Voice-activated zone selection
    const offVoice = bus.on('voiceCommand', (ev) => {
        if (ev.stepId === step.id && ev.type === 'zone') {
            selectZone(ev.value);
        }
    });
    const offCleanup = bus.on('stepWillChange', () => { offVoice(); offCleanup(); });

    render();
}

function renderLocationsTablet(host, step, controller) {
    const locations = [
        { id: 'home', icon: '🏠', name: 'Home', address: '314 Pine St, Apt 4B', x: 18, y: 35, eta: '12 min', dist: '4.2 km' },
        { id: 'work', icon: '💼', name: 'Work', address: '2 Market Plaza, Floor 8', x: 82, y: 28, eta: '28 min', dist: '11.7 km' },
    ];

    const pinsHtml = locations.map(loc => `
        <g class="loc-pin" data-loc="${loc.id}" role="button" tabindex="0" aria-label="${loc.name} — ${loc.address}">
            <circle cx="${loc.x}" cy="${loc.y}" r="5" class="loc-pin-circle"/>
            <text x="${loc.x}" y="${loc.y + 1.5}" class="loc-pin-icon">${loc.icon}</text>
            <text x="${loc.x}" y="${loc.y + 10}" class="loc-pin-label">${loc.name}</text>
        </g>
    `).join('');

    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Onboarding · 3 / 6</p>
            <h2 class="step-title">${step.title}</h2>
            <p class="step-purpose">${ONBOARDING_PURPOSES.locations}</p>
            <div class="locations-map">
                <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
                    <!-- Route line connecting Home to Work -->
                    <path class="loc-route-line" d="M${locations[0].x},${locations[0].y} C35,20 65,18 ${locations[1].x},${locations[1].y}"/>
                    <!-- Distance annotation -->
                    <text x="50" y="16" class="loc-dist-label">11.7 km · 28 min</text>
                    <!-- Location pins -->
                    ${pinsHtml}
                </svg>
                <div class="loc-detail-card" data-detail-card style="display:none;"></div>
            </div>
            <button type="button" class="btn btn-ghost loc-add-btn" data-add-loc>
                <span class="loc-add-icon">+</span> Add location
            </button>
            <div class="step-actions">
                ${tmShield(step.trustMoments)}
                <button type="button" role="button" class="btn btn-primary" data-cta="onboarding-advance">
                    Save places
                </button>
            </div>
        </div>
    `;

    // Pin click/focus handlers
    const detailCard = host.querySelector('[data-detail-card]');
    host.querySelectorAll('.loc-pin').forEach(pin => {
        const id = pin.dataset.loc;
        const loc = locations.find(l => l.id === id);
        if (!loc) return;

        function showDetail() {
            if (!detailCard) return;
            detailCard.innerHTML = `
                <span class="loc-detail-icon">${loc.icon}</span>
                <div class="loc-detail-body">
                    <strong>${loc.name}</strong>
                    <span class="t-caption">${loc.address}</span>
                    <span class="t-caption loc-detail-route">${loc.dist} · ${loc.eta} drive</span>
                </div>
            `;
            detailCard.style.display = 'flex';
            host.querySelectorAll('.loc-pin').forEach(p => p.classList.remove('is-selected'));
            pin.classList.add('is-selected');
        }
        pin.addEventListener('click', showDetail);
        pin.addEventListener('focus', showDetail);
    });

    // Add location button
    const addBtn = host.querySelector('[data-add-loc]');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            addBtn.textContent = '✓ Location added';
            addBtn.disabled = true;
            setTimeout(() => {
                addBtn.innerHTML = '<span class="loc-add-icon">+</span> Add location';
                addBtn.disabled = false;
            }, 2000);
        });
    }

    host.querySelector('[data-cta="onboarding-advance"]').addEventListener('click', () =>
        completeThenAdvance(host, controller, 'onboarding-locations-cta')
    );
}

function renderDriveExplainedTablet(host, step, controller, bus) {
    const slides = [
        {
            title: 'Level 4 Autonomy',
            html: `<p>AeroDrive operates at <strong>SAE Level 4</strong> — fully autonomous on highways and city arterials. The vehicle handles all driving tasks within its operational design domain.</p><p class="t-caption" style="margin-top:var(--sp-2);">No human attention required during autonomous operation.</p>`,
            narration: 'AeroDrive is Level 4 autonomous. It handles all driving on highways and city roads without needing your attention.',
        },
        {
            title: 'Safety Shield Sensors',
            html: `<p>A 360° sensor array of <strong>LiDAR, radar, and cameras</strong> creates a real-time safety shield around the vehicle. Redundant systems ensure no single point of failure.</p><p class="t-caption" style="margin-top:var(--sp-2);">12 cameras · 5 radar units · 3 LiDAR sensors</p>`,
            narration: 'The safety shield uses LiDAR, radar, and cameras for 360-degree awareness with full redundancy.',
        },
        {
            title: 'Battery & Charging',
            html: `<p>The 100 kWh battery provides <strong>320 miles of range</strong>. DC fast charging reaches 80% in under 30 minutes.</p><div class="charge-bar-container"><div class="charge-bar-fill" data-charge-bar></div><span class="charge-bar-label">80%</span></div>`,
            narration: 'The battery gives you 320 miles of range and charges to 80 percent in under 30 minutes.',
        },
        {
            title: 'Take-Over Protocol',
            html: `<p>When the car reaches its operational limit, it provides a <strong>10-second warning</strong> with visual, audio, and haptic alerts. You grip the wheel to confirm control.</p><p class="t-caption" style="margin-top:var(--sp-2);">The car never abandons you — it guides through every transition.</p>`,
            narration: 'When a take-over is needed, you get a 10-second warning. Grip the wheel to confirm. The car guides you through it.',
        },
    ];

    let currentSlide = 0;

    function render() {
        const slide = slides[currentSlide];
        const dotsHTML = slides.map((_, i) => `<span class="slide-dot ${i === currentSlide ? 'is-active' : ''}"></span>`).join('');
        const prevDisabled = currentSlide === 0 ? 'disabled' : '';
        const nextText = currentSlide === 3 ? 'Practice Take-Over' : 'Next Slide';

        host.innerHTML = `
            <div class="tablet-step">
                <p class="t-caption step-meta">Onboarding · 4 / 6</p>
                <h2 class="step-title">${step.title}</h2>
                <p class="step-purpose">${ONBOARDING_PURPOSES['drive-explained']}</p>
                <div class="slideshow-container">
                    <div class="slide-counter">${currentSlide + 1} / ${slides.length}</div>
                    <h3 class="slide-title">${slide.title}</h3>
                    <div class="slide-content">${slide.html}</div>
                    <div class="slide-indicators">${dotsHTML}</div>
                    <div class="slide-nav">
                        <button type="button" class="btn btn-ghost slide-prev" data-slide-prev ${prevDisabled}>← Prev</button>
                        <button type="button" class="btn btn-primary slide-next" data-slide-next>${nextText}</button>
                    </div>
                </div>
                <div class="step-actions">
                    ${tmShield(step.trustMoments)}
                    <button type="button" role="button" class="btn btn-primary" data-cta="onboarding-advance" style="display:none;">Skip</button>
                </div>
            </div>
        `;

        // Animate charge bar on slide 3
        if (currentSlide === 2) {
            const bar = host.querySelector('[data-charge-bar]');
            if (bar) {
                requestAnimationFrame(() => { bar.style.width = '80%'; });
            }
        }

        // TTS narration
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(slide.narration);
            u.rate = 0.95;
            setTimeout(() => window.speechSynthesis.speak(u), 300);
        }

        // Wire nav
        const prevBtn = host.querySelector('[data-slide-prev]');
        const nextBtn = host.querySelector('[data-slide-next]');
        if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => {
            if (currentSlide === 3) {
                // Advance to takeover drill step
                completeThenAdvance(host, controller, 'onboarding-drive-cta');
            } else {
                goToSlide(currentSlide + 1);
            }
        });
        // The hidden advance button (for test contract + presenter shortcut)
        const advBtn = host.querySelector('[data-cta="onboarding-advance"]');
        if (advBtn) advBtn.addEventListener('click', () => completeThenAdvance(host, controller, 'onboarding-drive-cta'));
    }

    function goToSlide(idx) {
        if (idx < 0 || idx > 3) return;
        currentSlide = idx;
        render();
    }

    // Voice commands: slide names jump to respective slides
    const offVoice = bus.on('voiceCommand', (ev) => {
        if (ev.stepId === step.id && ev.type === 'slide') {
            goToSlide(ev.value - 1); // value is 1-indexed
        }
    });
    const offCleanup = bus.on('stepWillChange', () => {
        offVoice(); offCleanup();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    });

    render();
}

function renderTakeoverDrillTablet(host, step, controller, bus) {
    const COUNTDOWN_SECS = 10;
    const GRIP_DURATION = 2500; // ms to hold for 100%
    const AUTONOMOUS_DISPLAY_SECS = 3;
    const FAILSAFE_RESET_SECS = 4;

    let stage = 'autonomous'; // autonomous | warning | success | failsafe
    let remaining = COUNTDOWN_SECS;
    let countdownInterval = null;
    let gripStartTime = null;
    let gripAnimFrame = null;
    let gripProgress = 0;
    let attempt = 1;
    let responseTime = 0;
    let countdownStartTime = 0;

    function render() {
        let stageContent = '';

        if (stage === 'autonomous') {
            stageContent = `
                <div class="drill-stage drill-autonomous">
                    <div class="drill-speed-display">
                        <span class="drill-speed-num">65</span>
                        <span class="drill-speed-unit">mph</span>
                    </div>
                    <p class="drill-status">Autonomous driving active…</p>
                    <p class="t-caption cluster-context">Take-over warning in ${AUTONOMOUS_DISPLAY_SECS}s</p>
                </div>`;
        } else if (stage === 'warning') {
            const pct = (remaining / COUNTDOWN_SECS) * 100;
            const isUrgent = remaining <= 3;
            const pulseClass = remaining <= 3 ? 'tactile-pulse-3hz tactile-glow' : remaining <= 5 ? 'tactile-pulse-2hz' : 'tactile-pulse-1hz';
            stageContent = `
                <div class="drill-stage drill-warning">
                    <div class="tactile-wheel ${pulseClass}" data-tactile-wheel>☸</div>
                    <div class="drill-countdown-ring">
                        <svg viewBox="0 0 120 120" class="countdown-svg">
                            <circle cx="60" cy="60" r="54" class="countdown-track" />
                            <circle cx="60" cy="60" r="54" class="countdown-progress" style="stroke-dashoffset: ${339.3 - (339.3 * pct / 100)};" />
                        </svg>
                        <span class="countdown-number ${isUrgent ? 'is-urgent' : ''}">${remaining}</span>
                    </div>
                    <div class="seat-vibrate-row">
                        <div class="seat-vibrate seat-vibrate-left" data-seat-left>◧</div>
                        <div class="drill-grip-area">
                            <button type="button" class="grip-button" data-grip-btn>
                                <span class="grip-fill" data-grip-fill style="width:${gripProgress}%"></span>
                                <span class="grip-label">GRIP STEERING WHEEL</span>
                            </button>
                            <p class="t-caption cluster-context">Press and hold (or spacebar)</p>
                        </div>
                        <div class="seat-vibrate seat-vibrate-right" data-seat-right>◨</div>
                    </div>
                    <p class="drill-attempt">ATTEMPT ${attempt}</p>
                </div>`;
        } else if (stage === 'success') {
            stageContent = `
                <div class="drill-stage drill-success">
                    <div class="drill-check">✓</div>
                    <p class="drill-result-title">CONTROL SECURED</p>
                    <p class="drill-response-time">Response time: ${(responseTime / 1000).toFixed(1)}s</p>
                    <p class="t-caption cluster-context">Excellent reaction. You're ready for the road.</p>
                </div>`;
        } else if (stage === 'failsafe') {
            stageContent = `
                <div class="drill-stage drill-failsafe">
                    <div class="drill-failsafe-icon">⚠</div>
                    <p class="drill-result-title">FAILSAFE ACTIVATED</p>
                    <p class="drill-failsafe-desc">Hazard lights on · Decelerating · Safe stop initiated</p>
                    <p class="t-caption cluster-context">The car safely stops itself when no driver responds.</p>
                    <p class="drill-attempt">Resetting for attempt ${attempt + 1}…</p>
                </div>`;
        }

        host.innerHTML = `
            <div class="tablet-step">
                <p class="t-caption step-meta">Onboarding · 5 / 6 · ⚠ Take-over drill</p>
                <h2 class="step-title">${step.title}</h2>
                <p class="step-purpose">${ONBOARDING_PURPOSES['takeover-drill']}</p>
                ${stageContent}
                <div class="step-actions">
                    ${tmShield(step.trustMoments)}
                    <button type="button" role="button" class="btn btn-primary" data-cta="onboarding-advance" ${stage !== 'success' ? 'style="display:none"' : ''}>Continue</button>
                </div>
            </div>
        `;

        if (stage === 'warning') wireGrip();
        // Always wire the advance button
        const advBtn = host.querySelector('[data-cta="onboarding-advance"]');
        if (advBtn) advBtn.addEventListener('click', () => completeThenAdvance(host, controller, 'onboarding-takeover-cta'));
    }

    let autonomousTimeout = null;
    let failsafeResetTimeout = null;

    function startAutonomous() {
        stage = 'autonomous';
        render();
        autonomousTimeout = setTimeout(() => { autonomousTimeout = null; startWarning(); }, AUTONOMOUS_DISPLAY_SECS * 1000);
    }

    function startWarning() {
        stage = 'warning';
        remaining = COUNTDOWN_SECS;
        gripProgress = 0;
        countdownStartTime = Date.now();
        render();

        // HUD alert
        const alertEl = document.getElementById('hud-alert');
        const alertText = document.getElementById('hud-alert-text');
        if (alertEl && alertText) {
            alertText.textContent = '⚠ TAKE OVER';
            alertEl.classList.remove('hidden');
        }

        // Add haptic icon to cluster
        const clusterHost = document.querySelector('[data-cluster-host]') || document.getElementById('cluster-host');
        if (clusterHost) {
            let hapticIcon = clusterHost.querySelector('.haptic-icon');
            if (!hapticIcon) {
                hapticIcon = document.createElement('div');
                hapticIcon.className = 'haptic-icon tactile-pulse-1hz';
                hapticIcon.textContent = '📳';
                hapticIcon.setAttribute('aria-label', 'Haptic feedback active');
                clusterHost.appendChild(hapticIcon);
            }
        }

        countdownInterval = setInterval(() => {
            remaining--;
            bus.emit('timedEvent', { stepIndex: step.globalIndex, eventId: 'takeover-tick', payload: { remaining } });
            if (remaining <= 0) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                triggerFailsafe();
            } else {
                // Re-render countdown
                const numEl = host.querySelector('.countdown-number');
                const progEl = host.querySelector('.countdown-progress');
                if (numEl) {
                    numEl.textContent = remaining;
                    if (remaining <= 3) numEl.classList.add('is-urgent');
                }
                if (progEl) {
                    const pct = (remaining / COUNTDOWN_SECS) * 100;
                    progEl.style.strokeDashoffset = 339.3 - (339.3 * pct / 100);
                }
                // Update tactile pulse frequency
                const wheelEl = host.querySelector('[data-tactile-wheel]');
                if (wheelEl) {
                    wheelEl.classList.remove('tactile-pulse-1hz', 'tactile-pulse-2hz', 'tactile-pulse-3hz', 'tactile-glow');
                    if (remaining <= 3) {
                        wheelEl.classList.add('tactile-pulse-3hz', 'tactile-glow');
                    } else if (remaining <= 5) {
                        wheelEl.classList.add('tactile-pulse-2hz');
                    } else {
                        wheelEl.classList.add('tactile-pulse-1hz');
                    }
                }
                // Sync haptic icon in cluster
                const clusterHost = document.querySelector('[data-cluster-host]') || document.getElementById('cluster-host');
                if (clusterHost) {
                    const hapticIcon = clusterHost.querySelector('.haptic-icon');
                    if (hapticIcon) {
                        hapticIcon.classList.remove('tactile-pulse-1hz', 'tactile-pulse-2hz', 'tactile-pulse-3hz', 'tactile-glow');
                        if (remaining <= 3) {
                            hapticIcon.classList.add('tactile-pulse-3hz', 'tactile-glow');
                        } else if (remaining <= 5) {
                            hapticIcon.classList.add('tactile-pulse-2hz');
                        } else {
                            hapticIcon.classList.add('tactile-pulse-1hz');
                        }
                    }
                }
            }
        }, 1000);
    }

    function wireGrip() {
        const gripBtn = host.querySelector('[data-grip-btn]');
        if (!gripBtn) return;

        function startGrip() {
            gripStartTime = Date.now();
            animateGrip();
        }

        function releaseGrip() {
            gripStartTime = null;
            gripProgress = 0;
            if (gripAnimFrame) { cancelAnimationFrame(gripAnimFrame); gripAnimFrame = null; }
            const fill = host.querySelector('[data-grip-fill]');
            if (fill) fill.style.width = '0%';
        }

        function animateGrip() {
            if (!gripStartTime) return;
            const elapsed = Date.now() - gripStartTime;
            gripProgress = Math.min(100, (elapsed / GRIP_DURATION) * 100);
            const fill = host.querySelector('[data-grip-fill]');
            if (fill) fill.style.width = `${gripProgress}%`;

            if (gripProgress >= 100) {
                triggerSuccess();
                return;
            }
            gripAnimFrame = requestAnimationFrame(animateGrip);
        }

        gripBtn.addEventListener('mousedown', startGrip);
        gripBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startGrip(); });
        gripBtn.addEventListener('mouseup', releaseGrip);
        gripBtn.addEventListener('mouseleave', releaseGrip);
        gripBtn.addEventListener('touchend', releaseGrip);
        gripBtn.addEventListener('touchcancel', releaseGrip);

        // Spacebar support
        let spaceHeld = false;
        function onKeyDown(e) {
            if (e.code === 'Space' && e.repeat) { e.preventDefault(); return; }
            if (e.code === 'Space' && stage === 'warning' && !spaceHeld) {
                e.preventDefault();
                spaceHeld = true;
                startGrip();
            } else if (e.code === 'Space') {
                e.preventDefault(); // prevent scroll
            }
        }
        function onKeyUp(e) {
            if (e.code === 'Space' && stage === 'warning') {
                e.preventDefault();
                spaceHeld = false;
                releaseGrip();
            }
        }
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // Cleanup on step change
        const offKey = bus.on('stepWillChange', () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            spaceHeld = false;
            offKey();
        });
    }

    function triggerSuccess() {
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
        if (gripAnimFrame) { cancelAnimationFrame(gripAnimFrame); gripAnimFrame = null; }
        responseTime = Date.now() - countdownStartTime;
        stage = 'success';

        // Stop all tactile animations immediately
        const wheelEl = host.querySelector('[data-tactile-wheel]');
        if (wheelEl) {
            wheelEl.classList.remove('tactile-pulse-1hz', 'tactile-pulse-2hz', 'tactile-pulse-3hz', 'tactile-glow');
            wheelEl.classList.add('tactile-success');
        }
        const seatLeft = host.querySelector('[data-seat-left]');
        const seatRight = host.querySelector('[data-seat-right]');
        if (seatLeft) seatLeft.classList.remove('seat-vibrate');
        if (seatRight) seatRight.classList.remove('seat-vibrate');

        // Remove haptic icon from cluster
        const clusterHost = document.querySelector('[data-cluster-host]') || document.getElementById('cluster-host');
        if (clusterHost) {
            const hapticIcon = clusterHost.querySelector('.haptic-icon');
            if (hapticIcon) hapticIcon.remove();
        }

        render();

        // HUD
        const alertEl = document.getElementById('hud-alert');
        const alertText = document.getElementById('hud-alert-text');
        if (alertEl && alertText) {
            alertText.textContent = 'TAKE-OVER: SECURED';
            alertEl.classList.remove('hidden');
            setTimeout(() => alertEl.classList.add('hidden'), 2500);
        }
        const ctxLabel = document.getElementById('hud-context-label');
        if (ctxLabel) ctxLabel.textContent = 'TAKE-OVER: SECURED';

        // TTS
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(`Control secured in ${(responseTime / 1000).toFixed(1)} seconds. Well done.`);
            u.rate = 0.95;
            window.speechSynthesis.speak(u);
        }
    }

    function triggerFailsafe() {
        stage = 'failsafe';
        render();

        // HUD
        const alertEl = document.getElementById('hud-alert');
        const alertText = document.getElementById('hud-alert-text');
        if (alertEl && alertText) {
            alertText.textContent = 'FAILSAFE: SAFE STOP';
            alertEl.classList.remove('hidden');
            setTimeout(() => alertEl.classList.add('hidden'), 3500);
        }

        // TTS
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance('Failsafe activated. The car is stopping safely. Let\'s try again.');
            u.rate = 0.95;
            window.speechSynthesis.speak(u);
        }

        // Reset after delay
        failsafeResetTimeout = setTimeout(() => {
            failsafeResetTimeout = null;
            attempt++;
            startAutonomous();
        }, FAILSAFE_RESET_SECS * 1000);
    }

    // Cleanup on step change
    const offCleanup = bus.on('stepWillChange', () => {
        if (autonomousTimeout) { clearTimeout(autonomousTimeout); autonomousTimeout = null; }
        if (failsafeResetTimeout) { clearTimeout(failsafeResetTimeout); failsafeResetTimeout = null; }
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
        if (gripAnimFrame) { cancelAnimationFrame(gripAnimFrame); gripAnimFrame = null; }
        offCleanup();
    });

    startAutonomous();
}

function renderPreferencesTablet(host, step, controller, bus) {
    const state = {
        acceleration: 'standard', // smooth | standard | dynamic
        distance: 'medium',       // close | medium | far
        lane: 'center',           // left | center | right
    };

    const accelOptions = [
        { id: 'smooth', label: 'Smooth', gForce: '0.15g', speed: '55 mph', barWidth: '33%' },
        { id: 'standard', label: 'Standard', gForce: '0.25g', speed: '65 mph', barWidth: '50%' },
        { id: 'dynamic', label: 'Dynamic', gForce: '0.40g', speed: '75 mph', barWidth: '75%' },
    ];
    const distOptions = [
        { id: 'close', label: 'Close', dots: 1, desc: '1.5s gap' },
        { id: 'medium', label: 'Medium', dots: 2, desc: '2.5s gap' },
        { id: 'far', label: 'Far', dots: 3, desc: '4.0s gap' },
    ];
    const laneOptions = [
        { id: 'left', label: 'Left' },
        { id: 'center', label: 'Center' },
        { id: 'right', label: 'Right' },
    ];

    function render() {
        const accel = accelOptions.find(o => o.id === state.acceleration);
        const dist = distOptions.find(o => o.id === state.distance);

        const accelBtns = accelOptions.map(o => `
            <button type="button" class="pref-option ${o.id === state.acceleration ? 'is-active' : ''}" data-accel="${o.id}">${o.label}</button>
        `).join('');
        const distBtns = distOptions.map(o => `
            <button type="button" class="pref-option ${o.id === state.distance ? 'is-active' : ''}" data-dist="${o.id}">${o.label}</button>
        `).join('');
        const laneBtns = laneOptions.map(o => `
            <button type="button" class="pref-option ${o.id === state.lane ? 'is-active' : ''}" data-lane="${o.id}">${o.label}</button>
        `).join('');

        const lanePos = state.lane === 'left' ? '25%' : state.lane === 'right' ? '75%' : '50%';

        host.innerHTML = `
            <div class="tablet-step">
                <p class="t-caption step-meta">Onboarding · 6 / 6</p>
                <h2 class="step-title">${step.title}</h2>
                <p class="step-purpose">${ONBOARDING_PURPOSES.preferences}</p>
                <div class="prefs-layout">
                    <div class="prefs-controls">
                        <div class="pref-group">
                            <label class="pref-group-label">Acceleration</label>
                            <div class="pref-options">${accelBtns}</div>
                        </div>
                        <div class="pref-group">
                            <label class="pref-group-label">Following Distance</label>
                            <div class="pref-options">${distBtns}</div>
                        </div>
                        <div class="pref-group">
                            <label class="pref-group-label">Lane Preference</label>
                            <div class="pref-options">${laneBtns}</div>
                        </div>
                    </div>
                    <div class="prefs-preview">
                        <div class="preview-road">
                            <div class="preview-car" style="left:${lanePos}">🚗</div>
                            <div class="preview-lead-car">🚙</div>
                        </div>
                        <div class="preview-stats">
                            <span class="preview-stat"><strong>Speed:</strong> ${accel.speed}</span>
                            <span class="preview-stat"><strong>G-Force:</strong> ${accel.gForce}</span>
                            <span class="preview-stat"><strong>Gap:</strong> ${dist.desc}</span>
                        </div>
                    </div>
                </div>
                <div class="step-actions">
                    ${tmShield(step.trustMoments)}
                    <button type="button" role="button" class="btn btn-primary" data-cta="onboarding-advance">Save drive style</button>
                </div>
            </div>
        `;

        // Wire events
        host.querySelectorAll('[data-accel]').forEach(btn => {
            btn.addEventListener('click', () => { state.acceleration = btn.dataset.accel; syncHUD(); render(); });
        });
        host.querySelectorAll('[data-dist]').forEach(btn => {
            btn.addEventListener('click', () => { state.distance = btn.dataset.dist; syncHUD(); render(); });
        });
        host.querySelectorAll('[data-lane]').forEach(btn => {
            btn.addEventListener('click', () => { state.lane = btn.dataset.lane; syncHUD(); render(); });
        });
        host.querySelector('[data-cta="onboarding-advance"]').addEventListener('click', () => {
            // Show completion pill (for test contract + visual feedback)
            const actions = host.querySelector('.step-actions');
            if (actions) {
                const pill = document.createElement('span');
                pill.className = 'is-complete';
                pill.setAttribute('role', 'status');
                pill.textContent = 'Done';
                actions.appendChild(pill);
            }
            // After brief delay, show simulation preview instead of advancing directly
            setTimeout(() => renderSimulationPreview(host, state, controller, bus), 350);
        });
    }

    function syncHUD() {
        // Acceleration bar
        const accel = accelOptions.find(o => o.id === state.acceleration);
        const bar = document.getElementById('hud-accel-bar');
        if (bar && accel) bar.style.width = accel.barWidth;

        // Distance dots
        const dist = distOptions.find(o => o.id === state.distance);
        const dots = document.querySelectorAll('#hud-dist-dots .hud-dot');
        if (dots.length && dist) {
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i < dist.dots);
            });
        }

        // Cockpit annotation
        const ann = document.getElementById('cockpit-annotation');
        if (ann) {
            ann.textContent = `Drive profile: ${state.acceleration} · ${state.distance} gap · ${state.lane} lane`;
            ann.classList.add('annotation-action');
            setTimeout(() => {
                ann.textContent = 'AeroDrive Onboarding Active';
                ann.classList.remove('annotation-action');
            }, 3000);
        }
    }

    // Voice commands: "complete"/"finish"/"done" handled globally by voice service as NAV_COMPLETE
    const offCleanup = bus.on('stepWillChange', () => { offCleanup(); });

    render();
}

/**
 * Simulation Mode Preview — renders a brief animated driving preview
 * after the user saves preferences, before advancing to the first Driving step.
 * Shows three sequential maneuvers: accelerate, follow, lane change (~8s total).
 */
function renderSimulationPreview(host, prefs, controller, bus) {
    const TOTAL_DURATION = 8000; // 8 seconds total
    const PHASE_ACCEL = 2700;   // accelerate phase
    const PHASE_FOLLOW = 2700;  // follow phase
    const PHASE_LANE = 2600;    // lane change phase

    let animTimer = null;
    let progressTimer = null;
    let autoAdvanceTimer = null;
    let cancelled = false;

    // Map preferences to animation parameters
    const accelSpeed = prefs.acceleration === 'dynamic' ? 'fast' : prefs.acceleration === 'smooth' ? 'slow' : 'normal';
    const followGap = prefs.distance === 'close' ? 'tight' : prefs.distance === 'far' ? 'wide' : 'medium';
    const laneTarget = prefs.lane === 'left' ? '25%' : prefs.lane === 'right' ? '75%' : '50%';
    const laneStart = '50%'; // always start center

    // Update cluster to show SIMULATION mode
    const clusterHost = document.querySelector('[data-cluster-host]') || document.getElementById('cluster-host');
    let prevClusterContent = '';
    if (clusterHost) {
        prevClusterContent = clusterHost.innerHTML;
        const autonomyPill = clusterHost.querySelector('.cluster-autonomy');
        if (autonomyPill) {
            autonomyPill.textContent = 'SIMULATION';
            autonomyPill.classList.add('sim-mode-label');
        }
    }

    host.innerHTML = `
        <div class="tablet-step sim-preview">
            <p class="t-caption step-meta">Simulation Preview</p>
            <h2 class="step-title">Your Drive Style in Action</h2>
            <p class="step-purpose">Previewing your preferences: ${prefs.acceleration} acceleration · ${prefs.distance} gap · ${prefs.lane} lane</p>
            <div class="sim-road" data-sim-road>
                <div class="sim-lane-marking sim-lane-left"></div>
                <div class="sim-lane-marking sim-lane-right"></div>
                <div class="sim-lane-marking sim-lane-center-left"></div>
                <div class="sim-lane-marking sim-lane-center-right"></div>
                <div class="sim-lead-car" data-sim-lead>🚙</div>
                <div class="sim-car" data-sim-car style="left:${laneStart}">🚗</div>
                <div class="sim-phase-label" data-sim-phase>Accelerating…</div>
            </div>
            <div class="sim-progress-bar" data-sim-progress>
                <div class="sim-progress-fill" data-sim-fill></div>
            </div>
            <div class="step-actions">
                <button type="button" class="btn btn-ghost sim-skip-btn" data-sim-skip>Skip preview</button>
            </div>
        </div>
    `;

    const carEl = host.querySelector('[data-sim-car]');
    const leadEl = host.querySelector('[data-sim-lead]');
    const phaseLabel = host.querySelector('[data-sim-phase]');
    const progressFill = host.querySelector('[data-sim-fill]');
    const skipBtn = host.querySelector('[data-sim-skip]');

    // Progress bar animation
    const startTime = Date.now();
    progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / TOTAL_DURATION) * 100);
        if (progressFill) progressFill.style.width = `${pct}%`;
    }, 50);

    // Phase 1: Accelerate from stop
    if (carEl) {
        carEl.classList.add('sim-accel-' + accelSpeed);
        carEl.style.bottom = '15%';
    }
    if (leadEl) {
        leadEl.style.bottom = '60%';
        leadEl.style.left = '50%';
        leadEl.style.opacity = '0';
    }

    // Animate: car moves up (accelerates)
    setTimeout(() => {
        if (cancelled) return;
        if (carEl) carEl.style.bottom = '35%';
    }, 200);

    // Phase 2: Follow lead vehicle
    animTimer = setTimeout(() => {
        if (cancelled) return;
        if (phaseLabel) phaseLabel.textContent = 'Following lead vehicle…';
        if (leadEl) {
            leadEl.style.opacity = '1';
            const gapOffset = followGap === 'tight' ? '55%' : followGap === 'wide' ? '72%' : '62%';
            leadEl.style.bottom = gapOffset;
        }
        if (carEl) carEl.style.bottom = '35%';
    }, PHASE_ACCEL);

    // Phase 3: Lane change
    setTimeout(() => {
        if (cancelled) return;
        if (phaseLabel) phaseLabel.textContent = 'Changing lanes…';
        if (carEl) {
            carEl.style.left = laneTarget;
            carEl.classList.add('sim-lane-change');
        }
    }, PHASE_ACCEL + PHASE_FOLLOW);

    // Auto-advance after animation completes
    autoAdvanceTimer = setTimeout(() => {
        if (cancelled) return;
        finishPreview();
    }, TOTAL_DURATION);

    // Skip button
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            if (cancelled) return;
            finishPreview();
        });
    }

    function finishPreview() {
        cancelled = true;
        if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
        if (animTimer) { clearTimeout(animTimer); animTimer = null; }
        if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }

        // Revert cluster SIMULATION label
        if (clusterHost) {
            const autonomyPill = clusterHost.querySelector('.cluster-autonomy');
            if (autonomyPill) {
                autonomyPill.textContent = 'STATIONARY';
                autonomyPill.classList.remove('sim-mode-label');
            }
        }

        // Advance to next step (first Driving step)
        controller.advance('simulation-preview-complete');
    }

    // Cleanup on step change (in case something else forces a step change)
    const offCleanup = bus.on('stepWillChange', () => {
        cancelled = true;
        if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
        if (animTimer) { clearTimeout(animTimer); animTimer = null; }
        if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
        offCleanup();
    });
}

/** Build the 6 onboarding step overrides. */
export function makeOnboardingSteps({ controller, bus }) {
    return [
        {
            id: 'onboarding.profile',
            stage: 'onboarding', slug: 'profile',
            label: 'Profile', title: ONBOARDING_TITLES.profile,
            trustMoments: TRUST_MOMENTS_BY_STEP.profile,
            voice: true,
            renderCluster: (host) => renderClusterFor('profile', host),
            renderTablet: (host, step) => renderProfileTablet(host, step, controller, bus),
        },
        {
            id: 'onboarding.comfort',
            stage: 'onboarding', slug: 'comfort',
            label: 'Comfort', title: ONBOARDING_TITLES.comfort,
            trustMoments: TRUST_MOMENTS_BY_STEP.comfort,
            voice: true,
            renderCluster: (host) => renderClusterFor('comfort', host),
            renderTablet: (host, step) => renderComfortTablet(host, step, controller, bus),
        },
        {
            id: 'onboarding.locations',
            stage: 'onboarding', slug: 'locations',
            label: 'Locations', title: ONBOARDING_TITLES.locations,
            trustMoments: TRUST_MOMENTS_BY_STEP.locations,
            voice: true,
            renderCluster: (host) => renderClusterFor('locations', host),
            renderTablet: (host, step) => renderLocationsTablet(host, step, controller),
        },
        {
            id: 'onboarding.drive-explained',
            stage: 'onboarding', slug: 'drive-explained',
            label: 'Drive explained', title: ONBOARDING_TITLES['drive-explained'],
            trustMoments: TRUST_MOMENTS_BY_STEP['drive-explained'],
            voice: true,
            renderCluster: (host) => renderClusterFor('drive-explained', host),
            renderTablet: (host, step) => renderDriveExplainedTablet(host, step, controller, bus),
        },
        {
            id: 'onboarding.takeover-drill',
            stage: 'onboarding', slug: 'takeover-drill',
            label: 'Take-over drill', title: ONBOARDING_TITLES['takeover-drill'],
            trustMoments: TRUST_MOMENTS_BY_STEP['takeover-drill'],
            voice: true,
            timedEvents: Array.from({ length: 10 }, (_, i) => ({ id: `takeover-tick-${i + 1}`, atMs: (i + 1) * 1000 })),
            renderCluster: (host) => renderClusterFor('takeover-drill', host),
            renderTablet: (host, step) => renderTakeoverDrillTablet(host, step, controller, bus),
        },
        {
            id: 'onboarding.preferences',
            stage: 'onboarding', slug: 'preferences',
            label: 'Preferences', title: ONBOARDING_TITLES.preferences,
            trustMoments: TRUST_MOMENTS_BY_STEP.preferences,
            voice: true,
            renderCluster: (host) => renderClusterFor('preferences', host),
            renderTablet: (host, step) => renderPreferencesTablet(host, step, controller, bus),
        },
    ];
}
