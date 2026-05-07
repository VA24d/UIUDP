/**
 * Driving module — four autonomous-driving scenarios.
 * unmapped-zone takeover, escalating fatigue protocol,
 * dynamic battery management (with POI map), weather sensor degradation.
 * See design.md "Driving Steps 7–9" and requirements Req 9.
 */

const SCENARIOS = {
    'unmapped-zone': {
        title: 'Unmapped zone take-over',
        intent: 'AeroDrive has detected an unmapped construction zone ahead and is handing control back to you.',
        autonomy: 'L4 ACTIVE',
        speedKph: 68,
        trust: { id: 'driving.unmapped.ask', text: 'AeroDrive asks, it doesn\'t take' },
    },
    fatigue: {
        title: 'Fatigue protocol',
        intent: 'Cabin sensors are picking up signs of fatigue. The system is escalating alerts in stages.',
        autonomy: 'L4 ACTIVE',
        speedKph: 105,
        trust: { id: 'driving.fatigue.watch', text: 'System watches you watching the road' },
    },
    battery: {
        title: 'Dynamic battery management',
        intent: 'The next charger on your route is out of range. AeroDrive is recommending a detour.',
        autonomy: 'L4 ACTIVE',
        speedKph: 92,
        trust: { id: 'driving.battery.math', text: 'Range math is shown, not hidden' },
    },
    weather: {
        title: 'Sensor degradation in rain',
        intent: 'Heavy rain is reducing effective sensor range. AeroDrive has adapted speed and following distance.',
        autonomy: 'L3 ASSISTED',
        speedKph: 74,
        trust: { id: 'driving.weather.sensor-transparency', text: 'Sensor limits shown in real time, not hidden' },
    },
};

function baseCluster(slug, host, alertClass = 'is-success', alertText = 'NORMAL', extra = '') {
    const s = SCENARIOS[slug];
    host.innerHTML = `
        <div class="cluster-title">
            <span class="t-caption cluster-context">Driving · ${s.title}</span>
            <span class="cluster-autonomy">${s.autonomy}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:var(--sp-3);">
            <span class="cluster-speed">${s.speedKph}</span>
            <span class="t-caption">km/h</span>
        </div>
        <div style="margin-top:var(--sp-4);">
            <span class="cluster-alert-pill ${alertClass}" data-alert>${alertText}</span>
        </div>
        ${extra}
    `;
}

function tmShield(tm) { return tm ? `<span class="trust-moment">${tm.text}</span>` : ''; }

// ── Transition Card ───────────────────────────────────────────────────

function renderTransitionCard(host, { phase, title, description, icon }, controller, bus) {
    host.innerHTML = `
        <div class="tablet-step transition-card">
            <div class="transition-card-icon">${icon || '🚗'}</div>
            <h2 class="step-title transition-card-title">${title}</h2>
            <p class="step-purpose transition-card-desc">${description}</p>
            <button type="button" role="button" class="btn btn-ghost transition-card-skip" data-cta="skip">Skip →</button>
        </div>
    `;

    // Auto-advance after 3 seconds
    const autoTimer = setTimeout(() => controller.advance(`${phase}-intro-auto`), 3000);
    host.querySelector('[data-cta="skip"]').addEventListener('click', () => {
        clearTimeout(autoTimer);
        controller.advance(`${phase}-intro-skip`);
    });
    const stop = bus.on('stepWillChange', () => { clearTimeout(autoTimer); stop(); });
}

function renderDrivingIntroCluster(host) {
    host.innerHTML = `
        <div class="cluster-title">
            <span class="t-caption cluster-context">Driving · Transition</span>
            <span class="cluster-autonomy">TRANSITIONING</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:var(--sp-3);">
            <span class="cluster-speed">—</span>
            <span class="t-caption">km/h</span>
        </div>
        <div style="margin-top:var(--sp-4);">
            <span class="cluster-alert-pill is-success">READY</span>
        </div>
    `;
}

function renderDrivingIntroTablet(host, step, controller, bus) {
    renderTransitionCard(host, {
        phase: 'driving',
        title: 'Entering Driving Mode',
        description: 'Experience how AeroDrive handles real-world driving scenarios',
        icon: '🛣️',
    }, controller, bus);
}

// ── Unmapped zone ─────────────────────────────────────────────────────

function renderUnmappedClusterInitial(host) {
    baseCluster('unmapped-zone', host, 'is-warning', 'WATCHING');
}

function renderUnmappedTablet(host, step, controller, bus) {
    const s = SCENARIOS['unmapped-zone'];
    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Driving · Unmapped zone</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <div class="unmapped-zone-map">
                <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
                    <!-- Road -->
                    <path class="unmapped-road" d="M5,40 L40,40 L60,40 L95,40"/>
                    <!-- Construction zone boundary (hatched) -->
                    <rect class="construction-boundary" x="42" y="20" width="30" height="30" rx="3"/>
                    <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(239,68,68,0.4)" stroke-width="2"/>
                    </pattern>
                    <rect x="42" y="20" width="30" height="30" rx="3" fill="url(#hatch)" opacity="0.6"/>
                    <!-- Construction icon -->
                    <text x="57" y="37" text-anchor="middle" font-size="8">🚧</text>
                    <!-- Vehicle position -->
                    <rect x="28" y="37" width="8" height="5" rx="1.5" fill="var(--color-accent-primary)"/>
                    <!-- Zone label -->
                    <text x="57" y="15" text-anchor="middle" class="unmapped-zone-label">UNMAPPED ZONE</text>
                </svg>
            </div>
            <div data-prompt-slot style="padding:var(--sp-4);background:var(--color-surface-subtle);border-radius:12px;">
                <p class="t-caption">Autonomous · monitoring zone</p>
                <p style="margin-top:var(--sp-2);">Zone not mapped — construction detected. The system will hand control back in a moment.</p>
            </div>
            <div class="step-actions">
                ${tmShield(s.trust)}
                <button type="button" role="button" class="btn btn-secondary" data-cta="next">
                    Next scenario
                </button>
            </div>
        </div>
    `;
    host.querySelector('[data-cta="next"]').addEventListener('click', () => controller.advance('driving-next'));

    const t = setTimeout(() => {
        const slot = host.querySelector('[data-prompt-slot]');
        if (slot) {
            slot.style.background = 'rgba(185,28,28,.06)';
            slot.style.border = '2px solid var(--color-critical)';
            slot.style.padding = 'var(--sp-5)';
            slot.innerHTML = `
                <p class="t-caption" style="color:var(--color-critical);font-weight:700;text-align:center;letter-spacing:0.08em;">⚠ TAKE MANUAL CONTROL</p>
                <p style="margin-top:var(--sp-2);text-align:center;color:var(--color-text-secondary);">Zone not mapped — construction detected ahead.</p>
                <div style="display:flex;align-items:center;justify-content:center;gap:var(--sp-5);margin-top:var(--sp-4);">
                    <div class="tactile-wheel tactile-pulse-1hz" data-tactile-wheel style="font-size:2rem;">☸</div>
                    <div class="takeover-countdown-ring" data-countdown-ring>
                        <svg viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="34" class="countdown-track"/>
                            <circle cx="40" cy="40" r="34" class="countdown-progress takeover-ring-anim"/>
                        </svg>
                        <span class="countdown-number">10</span>
                    </div>
                </div>
                <div class="drill-grip-area" style="margin-top:var(--sp-4);max-width:280px;margin-left:auto;margin-right:auto;">
                    <button type="button" class="grip-button" data-grip-btn>
                        <span class="grip-fill" data-grip-fill style="width:0%"></span>
                        <span class="grip-label">GRIP STEERING WHEEL</span>
                    </button>
                    <p class="t-caption cluster-context" style="text-align:center;margin-top:var(--sp-2);">Press and hold (or spacebar)</p>
                </div>
            `;

            // ── Grip mechanic ────────────────────────────────────────────
            const GRIP_DURATION = 2500;
            let gripStartTime = null;
            let gripAnimFrame = null;
            let gripProgress = 0;

            function startGrip() {
                gripStartTime = Date.now();
                animateGrip();
            }

            function releaseGrip() {
                gripStartTime = null;
                gripProgress = 0;
                if (gripAnimFrame) { cancelAnimationFrame(gripAnimFrame); gripAnimFrame = null; }
                const fill = slot.querySelector('[data-grip-fill]');
                if (fill) fill.style.width = '0%';
            }

            function animateGrip() {
                if (!gripStartTime) return;
                const elapsed = Date.now() - gripStartTime;
                gripProgress = Math.min(100, (elapsed / GRIP_DURATION) * 100);
                const fill = slot.querySelector('[data-grip-fill]');
                if (fill) fill.style.width = `${gripProgress}%`;

                if (gripProgress >= 100) {
                    // Success
                    if (countdownInterval) { clearInterval(countdownInterval); }
                    slot.innerHTML = `
                        <div class="drill-stage drill-success" style="text-align:center;padding:var(--sp-4);">
                            <div class="drill-check">✓</div>
                            <p class="drill-result-title">CONTROL SECURED</p>
                            <p class="t-caption cluster-context">Manual control confirmed.</p>
                        </div>
                    `;
                    setTimeout(() => controller.advance('driving-takeover-confirmed'), 800);
                    return;
                }
                gripAnimFrame = requestAnimationFrame(animateGrip);
            }

            const gripBtn = slot.querySelector('[data-grip-btn]');
            if (gripBtn) {
                gripBtn.addEventListener('mousedown', startGrip);
                gripBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startGrip(); });
                gripBtn.addEventListener('mouseup', releaseGrip);
                gripBtn.addEventListener('mouseleave', releaseGrip);
                gripBtn.addEventListener('touchend', releaseGrip);
                gripBtn.addEventListener('touchcancel', releaseGrip);
            }

            // Spacebar support
            let spaceHeld = false;
            function onKeyDown(e) {
                if (e.code === 'Space' && e.repeat) { e.preventDefault(); return; }
                if (e.code === 'Space' && !spaceHeld) {
                    e.preventDefault();
                    spaceHeld = true;
                    startGrip();
                }
            }
            function onKeyUp(e) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    spaceHeld = false;
                    releaseGrip();
                }
            }
            document.addEventListener('keydown', onKeyDown);
            document.addEventListener('keyup', onKeyUp);

            // Cleanup spacebar on step change
            const offKey = bus.on('stepWillChange', () => {
                document.removeEventListener('keydown', onKeyDown);
                document.removeEventListener('keyup', onKeyUp);
                spaceHeld = false;
                if (gripAnimFrame) { cancelAnimationFrame(gripAnimFrame); gripAnimFrame = null; }
                offKey();
            });

            // Countdown animation with tactile pulse escalation
            let remaining = 10;
            const countdownEl = slot.querySelector('.countdown-number');
            const countdownInterval = setInterval(() => {
                remaining--;
                if (countdownEl) countdownEl.textContent = remaining;
                // Tactile pulse escalation
                const wheelEl = slot.querySelector('[data-tactile-wheel]');
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
                if (remaining <= 0) clearInterval(countdownInterval);
            }, 1000);
            const stopCountdown = bus.on('stepWillChange', () => { clearInterval(countdownInterval); stopCountdown(); });
        }
        bus.emit('timedEvent', { stepIndex: step.globalIndex, eventId: 'takeover-prompt' });
    }, 2000);
    const stop = bus.on('stepWillChange', () => { clearTimeout(t); stop(); });
}

// ── Shared Grip Mechanic Helper ───────────────────────────────────────

function wireGripMechanic(container, controller, bus) {
    const GRIP_DURATION = 2000; // 2s hold for fatigue (shorter than takeover)
    let gripStartTime = null;
    let gripAnimFrame = null;

    function startGrip() {
        gripStartTime = Date.now();
        animateGrip();
    }

    function releaseGrip() {
        gripStartTime = null;
        if (gripAnimFrame) { cancelAnimationFrame(gripAnimFrame); gripAnimFrame = null; }
        const fill = container.querySelector('[data-grip-fill]');
        if (fill) fill.style.width = '0%';
    }

    function animateGrip() {
        if (!gripStartTime) return;
        const elapsed = Date.now() - gripStartTime;
        const progress = Math.min(100, (elapsed / GRIP_DURATION) * 100);
        const fill = container.querySelector('[data-grip-fill]');
        if (fill) fill.style.width = `${progress}%`;

        if (progress >= 100) {
            // Success — driver confirmed awake
            container.innerHTML = `
                <div style="text-align:center;padding:var(--sp-3);">
                    <span style="font-size:32px;color:var(--color-success);">✓</span>
                    <p style="font-weight:600;color:var(--color-success);margin-top:var(--sp-2);">DRIVER ALERT CONFIRMED</p>
                </div>
            `;
            return;
        }
        gripAnimFrame = requestAnimationFrame(animateGrip);
    }

    const gripBtn = container.querySelector('[data-grip-btn]');
    if (gripBtn) {
        gripBtn.addEventListener('mousedown', startGrip);
        gripBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startGrip(); });
        gripBtn.addEventListener('mouseup', releaseGrip);
        gripBtn.addEventListener('mouseleave', releaseGrip);
        gripBtn.addEventListener('touchend', releaseGrip);
        gripBtn.addEventListener('touchcancel', releaseGrip);
    }

    // Spacebar support
    let spaceHeld = false;
    function onKeyDown(e) {
        if (e.code === 'Space' && e.repeat) { e.preventDefault(); return; }
        if (e.code === 'Space' && !spaceHeld) {
            e.preventDefault();
            spaceHeld = true;
            startGrip();
        }
    }
    function onKeyUp(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            spaceHeld = false;
            releaseGrip();
        }
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    const offKey = bus.on('stepWillChange', () => {
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        if (gripAnimFrame) { cancelAnimationFrame(gripAnimFrame); gripAnimFrame = null; }
        offKey();
    });
}

// ── Fatigue ───────────────────────────────────────────────────────────

const FATIGUE_LEVELS = [
    { klass: 'escalation-1 is-warning', text: 'ATTENTION CHECK' },
    { klass: 'escalation-2 is-warning', text: 'ARE YOU AWAKE?' },
    { klass: 'escalation-3 is-critical', text: 'WAKE UP · SOS IN 10' },
];

const FATIGUE_CARD_DATA = [
    { levelClass: 'fatigue-level-1', icon: '🔔', title: 'Level 1 · Attention check', body: 'Soft chime. "Are you awake?"', caption: 'Gentle reminder — tap to acknowledge' },
    { levelClass: 'fatigue-level-2', icon: '⚠️', title: 'Level 2 · Warning buzzer', body: 'Louder buzzer. Seat pulse. HUD flashes.', caption: 'Respond now — grip wheel or tap' },
    { levelClass: 'fatigue-level-3', icon: '🚨', title: 'Level 3 · Critical · SOS engaged', body: 'Full cabin strobe. MRM armed. SOS countdown running.', caption: 'Emergency protocol active' },
];

function renderFatigueCluster(host, level = 0) {
    const l = FATIGUE_LEVELS[level];
    baseCluster('fatigue', host, l.klass, l.text);
}

function renderFatigueTablet(host, step, controller, bus) {
    const s = SCENARIOS.fatigue;
    const cardData = FATIGUE_CARD_DATA[0];
    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Driving · Fatigue protocol</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <div class="fatigue-card ${cardData.levelClass}" data-fatigue-state>
                <div class="fatigue-card-icon">${cardData.icon}</div>
                <div class="fatigue-card-body">
                    <p class="fatigue-card-title">${cardData.title}</p>
                    <p class="fatigue-card-desc">${cardData.body}</p>
                    <p class="fatigue-card-caption">${cardData.caption}</p>
                </div>
            </div>
            <div data-grip-slot style="display:none;margin-top:var(--sp-3);"></div>
            <div class="step-actions">
                ${tmShield(s.trust)}
                <button type="button" role="button" class="btn btn-secondary" data-cta="next">
                    Next scenario
                </button>
            </div>
        </div>
    `;
    host.querySelector('[data-cta="next"]').addEventListener('click', () => controller.advance('driving-next'));

    let level = 0;
    let gripActive = false;
    const tick = setInterval(() => {
        level = Math.min(level + 1, FATIGUE_LEVELS.length - 1);
        const slot = host.querySelector('[data-fatigue-state]');
        const cd = FATIGUE_CARD_DATA[level];
        if (slot) {
            slot.className = `fatigue-card ${cd.levelClass}`;
            slot.innerHTML = `
                <div class="fatigue-card-icon">${cd.icon}</div>
                <div class="fatigue-card-body">
                    <p class="fatigue-card-title">${cd.title}</p>
                    <p class="fatigue-card-desc">${cd.body}</p>
                    <p class="fatigue-card-caption">${cd.caption}</p>
                </div>
            `;
        }
        // Show grip wheel at level 2+ to confirm driver is awake
        if (level >= 1 && !gripActive) {
            gripActive = true;
            const gripSlot = host.querySelector('[data-grip-slot]');
            if (gripSlot) {
                gripSlot.style.display = 'block';
                gripSlot.innerHTML = `
                    <div style="text-align:center;">
                        <div class="tactile-wheel tactile-pulse-1hz" data-tactile-wheel>☸</div>
                        <div class="drill-grip-area" style="margin-top:var(--sp-3);max-width:260px;margin-left:auto;margin-right:auto;">
                            <button type="button" class="grip-button" data-grip-btn>
                                <span class="grip-fill" data-grip-fill style="width:0%"></span>
                                <span class="grip-label">CONFIRM AWAKE</span>
                            </button>
                            <p class="t-caption cluster-context" style="text-align:center;margin-top:var(--sp-2);">Hold to confirm you're alert</p>
                        </div>
                    </div>
                `;
                wireGripMechanic(gripSlot, controller, bus);
            }
        }
        bus.emit('timedEvent', { stepIndex: step.globalIndex, eventId: 'fatigue-escalate', payload: { level } });
        if (level >= FATIGUE_LEVELS.length - 1) clearInterval(tick);
    }, 4000);
    const stop = bus.on('stepWillChange', () => { clearInterval(tick); stop(); });
}

// ── Battery (with POI map + Range Math + ADAS Routing) ────────────────

function renderBatteryCluster(host) {
    baseCluster('battery', host, 'is-warning', 'CRITICAL RANGE',
        `<p class="t-caption" style="margin-top:var(--sp-2);">42 km remaining · 58 km to next charger</p>
         <span class="cluster-autonomy" style="margin-top:var(--sp-2);">L4 ACTIVE</span>`
    );
}

const POI_PINS = [
    { id: 'charger-1', x: 58, y: 34, icon: '⚡', label: 'Supercharger', sub: '+6 min · adds 80 km', recommended: true, relevance: 'high', relevanceReason: 'Battery below 20% — closest fast charger on route', type: 'charger' },
    { id: 'charger-2', x: 42, y: 18, icon: '⚡', label: 'City Charger', sub: '+12 min · adds 60 km', recommended: false, relevance: 'medium', relevanceReason: 'Alternate charger — slightly off route', type: 'charger' },
    { id: 'rest-stop', x: 72, y: 52, icon: '🍔', label: 'Rest Stop', sub: '+2 min · no charging', recommended: false, relevance: 'low', relevanceReason: 'Food available but no charging', type: 'food' },
    { id: 'rest-area', x: 85, y: 22, icon: '🅿️', label: 'Rest Area', sub: '+3 min · scenic overlook', recommended: false, relevance: 'low', relevanceReason: 'Rest area — no charging facilities', type: 'rest' },
];

function renderBatteryTablet(host, step, controller, bus) {
    const s = SCENARIOS.battery;

    // Sort POIs by relevance for rendering (high first = largest)
    const relevanceOrder = { high: 0, medium: 1, low: 2 };
    const sortedPOIs = [...POI_PINS].sort((a, b) => relevanceOrder[a.relevance] - relevanceOrder[b.relevance]);

    const pinSize = { high: 32, medium: 26, low: 20 };
    const pinOpacity = { high: 1, medium: 0.85, low: 0.65 };

    const pinsHtml = sortedPOIs.map((p, i) => {
        const size = pinSize[p.relevance];
        const opacity = pinOpacity[p.relevance];
        const pulseClass = p.type === 'charger' ? 'poi-pulse' : '';
        const badgeColor = p.relevance === 'high' ? '#10B981' : p.relevance === 'medium' ? '#F59E0B' : '#6B7280';
        const badgeText = p.relevance.toUpperCase();
        return `
        <g class="poi-pin poi-fade-in ${pulseClass}" data-poi="${p.id}" role="button" tabindex="0" aria-label="${p.label}" style="opacity:${opacity};animation-delay:${i * 150}ms;">
            <rect class="pin-bg" x="${p.x - size / 2}" y="${p.y - size / 2}" width="${size}" height="${size * 0.78}" rx="5"/>
            <text class="pin-icon" x="${p.x}" y="${p.y + 1}">${p.icon}</text>
            <rect class="poi-relevance-badge" x="${p.x + size / 2 - 14}" y="${p.y - size / 2 - 4}" width="16" height="7" rx="3" fill="${badgeColor}"/>
            <text x="${p.x + size / 2 - 6}" y="${p.y - size / 2 + 1}" font-size="3.5" fill="white" text-anchor="middle" font-weight="700">${badgeText}</text>
        </g>
    `}).join('');

    // Route candidates for ADAS animation
    const routeCandidates = `
        <path class="route-candidate" d="M10,30 Q30,28 50,30 Q75,32 90,30" data-route="1"/>
        <path class="route-candidate" d="M10,30 Q30,24 50,22 Q70,24 90,30" data-route="2"/>
        <path class="route-candidate" d="M10,30 Q25,34 45,36 Q70,34 90,30" data-route="3"/>
        <path class="route-selected route-corridor" d="M10,30 Q30,28 50,30 Q75,32 90,30" data-route="chosen"/>
    `;

    // Color-coded route segments for autonomous compatibility
    const adasSegments = `
        <path class="route-corridor sz-green" d="M10,30 Q20,29 30,29" stroke-width="3"/>
        <path class="route-corridor sz-yellow" d="M30,29 Q40,29 50,30" stroke-width="3"/>
        <path class="route-corridor sz-green" d="M50,30 Q65,31 80,31" stroke-width="3"/>
        <path class="route-corridor sz-red" d="M80,31 Q85,31 90,30" stroke-width="3"/>
    `;

    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Driving · Battery management</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>

            <div class="range-math-bar">
                <div class="range-math-item">
                    <span class="range-math-label">Current range</span>
                    <span class="range-math-value range-math-ok">42 km</span>
                </div>
                <div class="range-math-divider">→</div>
                <div class="range-math-item">
                    <span class="range-math-label">To charger</span>
                    <span class="range-math-value range-math-warn">58 km</span>
                </div>
                <div class="range-math-divider">=</div>
                <div class="range-math-item">
                    <span class="range-math-label">Deficit</span>
                    <span class="range-math-value range-math-critical">−16 km</span>
                </div>
            </div>

            <div class="poi-map-wrap">
                <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
                    <path class="poi-road" d="M5,30 L95,30"/>
                    <path class="poi-road" d="M60,5 L60,55"/>
                    ${adasSegments}
                    ${routeCandidates}
                    <path class="poi-route-detour" d="M30,30 Q45,30 52,28 Q56,22 58,20"/>
                    ${pinsHtml}
                    <rect x="7" y="27" width="6" height="6" rx="2" fill="var(--color-accent-primary)" opacity="0.9"/>
                </svg>
                <div class="adas-coverage-label" data-adas-label style="display:none;">87% autonomous coverage</div>
                <div id="poi-tooltip" class="poi-tooltip" style="display:none;left:0;top:0;"></div>
            </div>

            <div data-eta-slot></div>

            <div class="choice-list">
                <button type="button" class="choice-card is-default" data-choice="reroute" autofocus>
                    <span class="choice-default-tag">Recommended</span>
                    <span class="choice-title">Reroute to nearest charger</span>
                    <span class="t-caption">Adds 6 minutes. Keeps you above safe reserve.</span>
                </button>
                <button type="button" class="choice-card" data-choice="continue">
                    <span class="choice-title">Continue on planned route</span>
                    <span class="t-caption">AeroDrive will force low-power mode if range drops further.</span>
                </button>
            </div>

            <div class="step-actions">
                ${tmShield(s.trust)}
                <button type="button" role="button" class="btn btn-primary" data-cta="confirm">
                    Confirm choice
                </button>
            </div>
        </div>
    `;

    // Route selection animation: show candidates sequentially, then highlight chosen
    const candidates = host.querySelectorAll('.route-candidate');
    const chosenRoute = host.querySelector('.route-selected');
    const adasLabel = host.querySelector('[data-adas-label]');
    if (chosenRoute) chosenRoute.style.opacity = '0';
    candidates.forEach((c, i) => {
        c.style.opacity = '0';
        setTimeout(() => { c.style.opacity = '0.4'; }, 600 + i * 500);
    });
    setTimeout(() => {
        candidates.forEach(c => { c.style.opacity = '0.15'; });
        if (chosenRoute) { chosenRoute.style.opacity = '1'; chosenRoute.classList.add('route-selected-pulse'); }
        if (adasLabel) adasLabel.style.display = 'block';
    }, 2200);

    // POI tooltip with enhanced relevance info
    const tooltip = host.querySelector('#poi-tooltip');
    host.querySelectorAll('.poi-pin').forEach(pin => {
        const id = pin.dataset.poi;
        const poi = POI_PINS.find(p => p.id === id);
        if (!poi) return;

        function showTooltip() {
            if (!tooltip) return;
            const badgeColor = poi.relevance === 'high' ? '#10B981' : poi.relevance === 'medium' ? '#F59E0B' : '#6B7280';
            tooltip.innerHTML = `
                <strong>${poi.icon} ${poi.label}</strong>
                <span class="poi-tooltip-type">${poi.type}</span>
                <span>${poi.sub}</span>
                <span class="poi-tooltip-reason" style="color:${badgeColor};">${poi.relevanceReason}</span>
            `;
            const rect = pin.getBoundingClientRect();
            const wrap = host.querySelector('.poi-map-wrap').getBoundingClientRect();
            tooltip.style.display = 'block';
            tooltip.style.left = `${rect.left - wrap.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - wrap.top}px`;
            const etaSlot = host.querySelector('[data-eta-slot]');
            if (etaSlot) {
                etaSlot.innerHTML = `<div class="poi-eta-update">📍 ${poi.label} selected — ${poi.sub}</div>`;
            }
        }
        pin.addEventListener('mouseenter', showTooltip);
        pin.addEventListener('focus', showTooltip);
        pin.addEventListener('mouseleave', () => { if (tooltip) tooltip.style.display = 'none'; });
        pin.addEventListener('click', () => {
            host.querySelectorAll('.poi-pin').forEach(p => p.classList.remove('is-selected'));
            pin.classList.add('is-selected');
            showTooltip();
        });
    });

    const defaultCard = host.querySelector('[data-choice="reroute"]');
    if (defaultCard && typeof defaultCard.focus === 'function') {
        try { defaultCard.focus(); } catch { /* jsdom */ }
    }

    // ── Traffic rerouting notification (appears after 3s) ────────────────
    const trafficTimer = setTimeout(() => {
        const etaSlot = host.querySelector('[data-eta-slot]');
        if (etaSlot) {
            etaSlot.innerHTML = `
                <div class="traffic-reroute-notification" style="padding:var(--sp-3) var(--sp-4);background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:10px;animation:hud-alert-in var(--motion-dur-step) var(--motion-ease-forward);">
                    <p style="font-weight:700;color:var(--color-critical);margin-bottom:var(--sp-1);">🚦 Traffic detected ahead — rerouting</p>
                    <p class="t-caption" style="color:var(--color-text-secondary);">Original: 45 min → New: 38 min <strong style="color:var(--color-success);">(saved 7 min)</strong></p>
                </div>
            `;
        }
        // Add traffic indicator (red segment) on the map
        const mapSvg = host.querySelector('.poi-map-wrap svg');
        if (mapSvg) {
            // Red traffic segment on original route
            const trafficSegment = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            trafficSegment.setAttribute('d', 'M40,30 Q50,30 60,30');
            trafficSegment.setAttribute('stroke', '#EF4444');
            trafficSegment.setAttribute('stroke-width', '4');
            trafficSegment.setAttribute('fill', 'none');
            trafficSegment.setAttribute('opacity', '0.7');
            trafficSegment.setAttribute('stroke-linecap', 'round');
            trafficSegment.classList.add('traffic-segment-pulse');
            mapSvg.appendChild(trafficSegment);

            // Animated new route path (different from charger reroute)
            const newRoute = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            newRoute.setAttribute('d', 'M30,30 Q40,42 55,44 Q70,42 80,34 Q88,30 90,30');
            newRoute.setAttribute('stroke', 'var(--color-success)');
            newRoute.setAttribute('stroke-width', '2.5');
            newRoute.setAttribute('fill', 'none');
            newRoute.setAttribute('stroke-dasharray', '4 2');
            newRoute.setAttribute('opacity', '0');
            newRoute.style.transition = 'opacity 0.8s ease';
            mapSvg.appendChild(newRoute);

            // Animate new route appearing
            setTimeout(() => { newRoute.setAttribute('opacity', '0.9'); }, 300);
        }
    }, 3000);

    // Cleanup traffic timer on step change
    const stopTraffic = bus.on('stepWillChange', () => { clearTimeout(trafficTimer); stopTraffic(); });

    // ── Choice card click handlers ───────────────────────────────────────
    const rerouteCard = host.querySelector('[data-choice="reroute"]');
    const continueCard = host.querySelector('[data-choice="continue"]');

    if (rerouteCard) {
        rerouteCard.addEventListener('click', () => {
            rerouteCard.classList.add('is-selected');
            if (continueCard) continueCard.classList.add('is-dimmed');

            // Animate reroute on map
            const detour = host.querySelector('.poi-route-detour');
            if (detour) detour.classList.add('route-animating');
            const chargerPin = host.querySelector('[data-poi="charger-1"]');
            if (chargerPin) chargerPin.classList.add('poi-pulse-active');

            // Show rerouting status
            const etaSlot = host.querySelector('[data-eta-slot]');
            if (etaSlot) etaSlot.innerHTML = '<div class="poi-eta-update">🔄 Rerouting to Supercharger… +6 min</div>';

            // Advance after animation
            setTimeout(() => controller.advance('driving-battery-reroute'), 1500);
        });
    }

    if (continueCard) {
        continueCard.addEventListener('click', () => {
            continueCard.classList.add('is-selected');
            if (rerouteCard) rerouteCard.classList.add('is-dimmed');

            const etaSlot = host.querySelector('[data-eta-slot]');
            if (etaSlot) etaSlot.innerHTML = '<div class="poi-eta-update">⚡ Low-power mode armed — monitoring range</div>';

            setTimeout(() => controller.advance('driving-battery-continue'), 800);
        });
    }

    host.querySelector('[data-cta="confirm"]').addEventListener('click', () => controller.advance('driving-battery-confirmed'));
}

// ── Weather / sensor degradation ─────────────────────────────────────

function renderWeatherCluster(host) {
    const s = SCENARIOS.weather;
    host.innerHTML = `
        <div class="cluster-title">
            <span class="t-caption cluster-context">Driving · ${s.title}</span>
            <span class="cluster-autonomy">${s.autonomy}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:var(--sp-3);">
            <span class="cluster-speed">${s.speedKph}</span>
            <span class="t-caption">km/h</span>
        </div>
        <div style="margin-top:var(--sp-3);">
            <span class="cluster-alert-pill escalation-2 is-warning">SENSOR DEGRADED</span>
        </div>
        <p class="t-caption" style="margin-top:var(--sp-3);color:var(--color-warning);">
            Effective range: 60m (normal 120m) · +5m following distance
        </p>
    `;
}

function renderWeatherTablet(host, step, controller) {
    const s = SCENARIOS.weather;

    const sensors = [
        { name: 'LiDAR', pct: 52, degraded: true },
        { name: 'Camera', pct: 38, degraded: true },
        { name: 'Radar', pct: 91, degraded: false },
        { name: 'GPS', pct: 99, degraded: false },
    ];

    const sensorBarsHtml = sensors.map(sen => `
        <div class="sensor-row">
            <span class="sensor-name">${sen.name}</span>
            <div class="sensor-bar-track">
                <div class="sensor-bar-fill ${sen.degraded ? 'is-degraded' : 'is-ok'}"
                     style="width:0%;" data-pct="${sen.pct}"></div>
            </div>
            <span class="sensor-pct">${sen.pct}%</span>
        </div>
    `).join('');

    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Driving · Weather / sensors</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);align-items:start;">
                <div class="weather-radar">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                        <circle class="radar-ring" cx="50" cy="50" r="40"/>
                        <circle class="radar-ring" cx="50" cy="50" r="28"/>
                        <circle class="radar-ring" cx="50" cy="50" r="16"/>
                        <circle class="radar-range-limit" cx="50" cy="50" r="22"/>
                        <path class="radar-sweep" d="M50,50 L50,10 A40,40 0 0,1 82,27 Z"/>
                        <circle cx="50" cy="50" r="3" fill="var(--color-accent-primary)"/>
                        <rect class="radar-noise" x="30" y="20" width="3" height="3" rx="1"/>
                        <rect class="radar-noise" x="60" y="35" width="2" height="2" rx="1"/>
                        <rect class="radar-noise" x="45" y="72" width="3" height="3" rx="1"/>
                    </svg>
                </div>
                <div>
                    <div class="weather-status-bar">
                        <span class="weather-status-icon">🌧</span>
                        <div class="weather-status-text">
                            <span class="weather-status-title">Heavy rain</span>
                            <span class="weather-status-sub">Sensor range reduced to 60 m</span>
                        </div>
                    </div>
                    <div class="sensor-degradation-bar">${sensorBarsHtml}</div>
                </div>
            </div>
            <div class="step-actions">
                <span class="trust-moment">${s.trust.text}</span>
                <button type="button" role="button" class="btn btn-secondary" data-cta="next">
                    Next scenario
                </button>
            </div>
        </div>
    `;

    setTimeout(() => {
        host.querySelectorAll('.sensor-bar-fill').forEach(bar => {
            bar.style.width = `${bar.dataset.pct}%`;
        });
    }, 200);

    host.querySelector('[data-cta="next"]').addEventListener('click', () => controller.advance('driving-next'));
}

// ── Exports ───────────────────────────────────────────────────────────

export function makeDrivingSteps({ controller, bus }) {
    return [
        {
            id: 'driving.intro',
            stage: 'driving', slug: 'intro',
            label: 'Driving intro', title: 'Entering Driving Mode',
            trustMoments: [],
            renderCluster: (host) => renderDrivingIntroCluster(host),
            renderTablet: (host, step) => renderDrivingIntroTablet(host, step, controller, bus),
        },
        {
            id: 'driving.unmapped-zone',
            stage: 'driving', slug: 'unmapped-zone',
            label: 'Unmapped zone', title: SCENARIOS['unmapped-zone'].title,
            trustMoments: [SCENARIOS['unmapped-zone'].trust],
            renderCluster: (host) => renderUnmappedClusterInitial(host),
            renderTablet: (host, step) => renderUnmappedTablet(host, step, controller, bus),
        },
        {
            id: 'driving.fatigue',
            stage: 'driving', slug: 'fatigue',
            label: 'Fatigue watch', title: SCENARIOS.fatigue.title,
            trustMoments: [SCENARIOS.fatigue.trust],
            renderCluster: (host) => renderFatigueCluster(host, 0),
            renderTablet: (host, step) => renderFatigueTablet(host, step, controller, bus),
        },
        {
            id: 'driving.battery',
            stage: 'driving', slug: 'battery',
            label: 'Battery reroute', title: SCENARIOS.battery.title,
            trustMoments: [SCENARIOS.battery.trust],
            renderCluster: (host) => renderBatteryCluster(host),
            renderTablet: (host, step) => renderBatteryTablet(host, step, controller, bus),
        },
        {
            id: 'driving.weather',
            stage: 'driving', slug: 'weather',
            label: 'Weather sensors', title: SCENARIOS.weather.title,
            trustMoments: [SCENARIOS.weather.trust],
            renderCluster: (host) => renderWeatherCluster(host),
            renderTablet: (host, step) => renderWeatherTablet(host, step, controller),
        },
    ];
}

export { FATIGUE_LEVELS };
