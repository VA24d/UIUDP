/**
 * Driving module — three autonomous-driving scenarios.
 * Ported in shape from `driving_prototype/app.js`: unmapped-zone takeover (4B),
 * escalating fatigue protocol (5A/5B), dynamic battery management (1C).
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

// ── Unmapped zone ─────────────────────────────────────────────────────

function renderUnmappedClusterInitial(host) {
    baseCluster('unmapped-zone', host, 'is-warning', 'WATCHING');
}

function renderUnmappedClusterTakeover(host) {
    baseCluster('unmapped-zone', host, 'is-critical', 'TAKE OVER NOW',
        '<p class="t-caption" style="margin-top:var(--sp-3);color:var(--color-critical);font-weight:700;">EYES ON ROAD</p>'
    );
}

function renderUnmappedTablet(host, step, controller, bus) {
    const s = SCENARIOS['unmapped-zone'];
    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Driving · Unmapped zone</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <div data-prompt-slot style="padding:var(--sp-4);background:var(--color-surface-subtle);border-radius:12px;">
                <p class="t-caption">Autonomous · monitoring zone</p>
                <p style="margin-top:var(--sp-2);">The system will hand control back in a moment. No action needed yet.</p>
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

    // After 2s, escalate both hosts to the takeover prompt simultaneously (Req 9.4).
    const t = setTimeout(() => {
        const slot = host.querySelector('[data-prompt-slot]');
        if (slot) {
            slot.style.background = 'rgba(185,28,28,.06)';
            slot.style.border = '2px solid var(--color-critical)';
            slot.innerHTML = `
                <p class="t-caption" style="color:var(--color-critical);font-weight:700;">TAKE MANUAL CONTROL</p>
                <p style="margin-top:var(--sp-2);">Construction detected. Reason: zone not mapped.</p>
                <button type="button" role="button" class="btn btn-primary" style="margin-top:var(--sp-3);" data-cta="grip">Grip wheel</button>
            `;
            const grip = slot.querySelector('[data-cta="grip"]');
            if (grip) grip.addEventListener('click', () => controller.advance('driving-takeover-confirmed'));
        }
        // Cluster listens to the same event — keeps dual-display in sync (Req 9.4).
        bus.emit('timedEvent', { stepIndex: step.globalIndex, eventId: 'takeover-prompt' });
    }, 2000);
    const stop = bus.on('stepWillChange', () => { clearTimeout(t); stop(); });
}

// ── Fatigue ───────────────────────────────────────────────────────────

const FATIGUE_LEVELS = [
    { klass: 'escalation-1 is-warning', text: 'ATTENTION CHECK' },
    { klass: 'escalation-2 is-warning', text: 'ARE YOU AWAKE?' },
    { klass: 'escalation-3 is-critical', text: 'WAKE UP · SOS IN 10' },
];

function renderFatigueCluster(host, level = 0) {
    const l = FATIGUE_LEVELS[level];
    baseCluster('fatigue', host, l.klass, l.text);
}

function renderFatigueTablet(host, step, controller, bus) {
    const s = SCENARIOS.fatigue;
    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Driving · Fatigue protocol</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <div data-fatigue-state style="padding:var(--sp-4);background:var(--color-surface-subtle);border-radius:12px;">
                <p class="t-caption">Level 1 · Attention check</p>
                <p style="margin-top:var(--sp-2);">Soft chime. "Are you awake?"</p>
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

    // Escalate every 4s.
    let level = 0;
    const tick = setInterval(() => {
        level = Math.min(level + 1, FATIGUE_LEVELS.length - 1);
        const slot = host.querySelector('[data-fatigue-state]');
        const labels = ['Level 1 · Attention check', 'Level 2 · Warning buzzer', 'Level 3 · Critical · SOS engaged'];
        const bodies = [
            'Soft chime. "Are you awake?"',
            'Louder buzzer. Seat pulse. HUD flashes.',
            'Full cabin strobe. MRM armed. SOS countdown running.',
        ];
        if (slot) slot.innerHTML = `<p class="t-caption">${labels[level]}</p><p style="margin-top:var(--sp-2);">${bodies[level]}</p>`;
        bus.emit('timedEvent', { stepIndex: step.globalIndex, eventId: 'fatigue-escalate', payload: { level } });
        if (level >= FATIGUE_LEVELS.length - 1) clearInterval(tick);
    }, 4000);
    const stop = bus.on('stepWillChange', () => { clearInterval(tick); stop(); });
}

// ── Battery ───────────────────────────────────────────────────────────

function renderBatteryCluster(host) {
    baseCluster('battery', host, 'is-warning', 'CRITICAL RANGE',
        '<p class="t-caption" style="margin-top:var(--sp-2);">42 km remaining · 58 km to next charger</p>'
    );
}

function renderBatteryTablet(host, step, controller) {
    const s = SCENARIOS.battery;
    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Driving · Battery management</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <div class="choice-list">
                <button type="button" class="choice-card is-default" data-choice="reroute" autofocus>
                    <span class="choice-default-tag">Default</span>
                    <span class="choice-title">Reroute to nearest charger (recommended)</span>
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
    const defaultCard = host.querySelector('[data-choice="reroute"]');
    if (defaultCard && typeof defaultCard.focus === 'function') {
        try { defaultCard.focus(); } catch { /* jsdom */ }
    }
    host.querySelector('[data-cta="confirm"]').addEventListener('click', () => controller.advance('driving-battery-confirmed'));
}

// ── Exports ───────────────────────────────────────────────────────────

export function makeDrivingSteps({ controller, bus }) {
    return [
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
            renderTablet: (host, step) => renderBatteryTablet(host, step, controller),
        },
    ];
}

export { FATIGUE_LEVELS };
