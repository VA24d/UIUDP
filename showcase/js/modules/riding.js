/**
 * Riding module — three passenger-mode scenarios.
 * See design.md "Riding Steps 10–12" and requirements Req 10.
 */

const SCENARIOS = {
    environment: {
        title: 'What the car sees',
        intent: 'AeroDrive shares what its sensors perceive so you know what it is reacting to.',
        trust: { id: 'riding.environment.transparent', text: 'You see what the car sees' },
    },
    maneuver: {
        title: 'Maneuver preview',
        intent: 'Every sharp turn or brake is announced on the tablet before it happens on the road.',
        trust: { id: 'riding.maneuver.preview', text: 'You see the turn before the car makes it' },
    },
    'productive-time': {
        title: 'Your time, back',
        intent: 'When the autonomy budget is steady, the system invites you to step away and use the time.',
        trust: { id: 'riding.productive.time', text: 'Your time is yours back' },
    },
};

// Safe-zone segment data for the route bar (Task 10)
const SAFE_ZONE_SEGMENTS = [
    { type: 'green', flex: 2.1, label: null },
    { type: 'yellow', flex: 0.8, label: '2.1 km' },
    { type: 'red', flex: 1.2, label: '3.8 km' },
    { type: 'green', flex: 0.9, label: null },
];

// Marker positions per riding step index (0=environment, 1=maneuver, 2=productive)
const SAFE_ZONE_POSITIONS = [15, 40, 65];

// ── Mini Perception Radar (Task 3) ───────────────────────────────────

function buildMiniPerceptionSVG() {
    return `
        <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid meet" class="cluster-mini-radar" aria-label="Perception radar">
            <!-- Range arcs -->
            <path d="M10,38 A20,20 0 0,1 50,38" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
            <path d="M18,38 A12,12 0 0,1 42,38" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
            <!-- Bounding boxes -->
            <rect x="12" y="14" width="10" height="6" rx="1" fill="none" stroke="#4ADE80" stroke-width="0.8" opacity="0.9"/>
            <rect x="36" y="10" width="8" height="5" rx="1" fill="none" stroke="#4ADE80" stroke-width="0.8" opacity="0.8"/>
            <rect x="8" y="24" width="5" height="9" rx="1" fill="none" stroke="#FBBF24" stroke-width="0.8" opacity="0.85"/>
            <rect x="44" y="20" width="6" height="6" rx="1" fill="none" stroke="#60A5FA" stroke-width="0.8" opacity="0.7"/>
            <!-- Ego vehicle -->
            <rect x="27" y="33" width="6" height="5" rx="1.5" fill="var(--color-accent-primary, #2B4CFF)"/>
        </svg>
    `;
}

function baseCluster(host, slug, extra = '') {
    host.innerHTML = `
        <div class="cluster-title">
            <span class="t-caption cluster-context">Riding · ${SCENARIOS[slug].title}</span>
            <span class="cluster-passenger-pill">PASSENGER MODE</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:var(--sp-3);">
            <span class="cluster-speed">62</span>
            <span class="t-caption">km/h</span>
        </div>
        <div style="margin-top:var(--sp-4);">
            <span class="cluster-alert-pill is-success" data-cluster-pill>SERENE</span>
        </div>
        ${extra}
    `;
}

function tmShield(tm) { return tm ? `<span class="trust-moment">${tm.text}</span>` : ''; }

// ── Safe-Zone Bar (Task 10) ──────────────────────────────────────────

function renderSafeZoneBar(ridingStepIndex) {
    const markerPos = SAFE_ZONE_POSITIONS[ridingStepIndex] || 15;
    const segmentsHtml = SAFE_ZONE_SEGMENTS.map(seg => `
        <div class="sz-segment sz-${seg.type}" style="flex:${seg.flex};"></div>
    `).join('');

    // Distance labels at boundaries
    const labelsHtml = SAFE_ZONE_SEGMENTS.reduce((acc, seg, i) => {
        if (seg.label) {
            // Calculate position as percentage of total flex
            const totalFlex = SAFE_ZONE_SEGMENTS.reduce((s, sg) => s + sg.flex, 0);
            const priorFlex = SAFE_ZONE_SEGMENTS.slice(0, i).reduce((s, sg) => s + sg.flex, 0);
            const pct = ((priorFlex / totalFlex) * 100).toFixed(1);
            acc += `<span class="sz-label" style="left:${pct}%;">${seg.label}</span>`;
        }
        return acc;
    }, '');

    return `
        <div class="safe-zone-bar" aria-label="Safe zone indicator">
            ${segmentsHtml}
            <div class="sz-marker" style="left:${markerPos}%;"></div>
            ${labelsHtml}
        </div>
    `;
}

// ── Transition Card (Riding) ──────────────────────────────────────────

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

function renderRidingIntroCluster(host) {
    host.innerHTML = `
        <div class="cluster-title">
            <span class="t-caption cluster-context">Riding · Transition</span>
            <span class="cluster-passenger-pill">PASSENGER MODE</span>
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

function renderRidingIntroTablet(host, step, controller, bus) {
    renderTransitionCard(host, {
        phase: 'riding',
        title: 'Entering Passenger Mode',
        description: 'See how AeroDrive keeps you informed as a passenger',
        icon: '🧘',
    }, controller, bus);
}

// ── Environment / Perception HUD ─────────────────────────────────────

const DETECTED_OBJECTS = [
    { type: 'car', x: 35, y: 22, w: 22, h: 12, label: 'VEH', dist: '18m', delay: 0, visible: true },
    { type: 'car', x: 62, y: 18, w: 18, h: 10, label: 'VEH', dist: '31m', delay: 200, visible: true },
    { type: 'pedestrian', x: 14, y: 30, w: 8, h: 16, label: 'PED', dist: '9m', delay: 400, visible: true },
    { type: 'sign', x: 78, y: 10, w: 10, h: 10, label: 'SGN', dist: '45m', delay: 600, visible: true },
    { type: 'car', x: 50, y: 48, w: 20, h: 11, label: 'VEH', dist: '52m', delay: 150, visible: true },
];

// Extra objects that can cycle in
const EXTRA_OBJECTS = [
    { type: 'pedestrian', x: 82, y: 40, w: 7, h: 14, label: 'PED', dist: '12m', delay: 300, visible: false },
    { type: 'car', x: 22, y: 50, w: 16, h: 9, label: 'VEH', dist: '38m', delay: 450, visible: false },
    { type: 'sign', x: 45, y: 8, w: 9, h: 9, label: 'SGN', dist: '60m', delay: 500, visible: false },
    { type: 'pedestrian', x: 70, y: 45, w: 7, h: 13, label: 'PED', dist: '22m', delay: 350, visible: false },
];

function buildPerceptionSVG(objects) {
    const W = 100, H = 65;
    const gridLines = [];
    for (let x = 10; x < W; x += 20) gridLines.push(`<line class="perception-grid-line" x1="${x}" y1="0" x2="${x}" y2="${H}"/>`);
    for (let y = 10; y < H; y += 15) gridLines.push(`<line class="perception-grid-line" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`);

    const bboxes = objects.filter(o => o.visible).map((obj, i) => `
        <g class="perception-bbox-enter" style="animation-delay:${150 + i * 150}ms;">
            <rect class="perception-bbox is-${obj.type}"
                  x="${obj.x}" y="${obj.y}" width="${obj.w}" height="${obj.h}"/>
            <text class="perception-label" x="${obj.x + 1}" y="${obj.y - 2}">${obj.label} ${obj.dist}</text>
        </g>
    `).join('');

    const egoX = W / 2, egoY = H - 4;
    const arcR = 30;

    return `
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" class="perception-svg">
            ${gridLines.join('')}
            <path class="perception-range-arc" d="M${egoX - arcR},${egoY} A${arcR},${arcR} 0 0,1 ${egoX + arcR},${egoY}"/>
            <path class="perception-range-arc" d="M${egoX - 20},${egoY} A20,20 0 0,1 ${egoX + 20},${egoY}" opacity="0.5"/>
            <path class="perception-range-sweep" d="M${egoX},${egoY} L${egoX},${egoY - arcR} A${arcR},${arcR} 0 0,1 ${egoX + arcR * 0.5},${egoY - arcR * 0.87} Z"/>
            <g data-bbox-container>${bboxes}</g>
            <rect class="perception-ego" x="${egoX - 3}" y="${egoY - 5}" width="6" height="8" rx="1"/>
        </svg>
    `;
}

function renderEnvironmentCluster(host) {
    baseCluster(host, 'environment',
        `${buildMiniPerceptionSVG()}
        ${renderSafeZoneBar(0)}
        <p class="t-caption" style="margin-top:var(--sp-3);color:var(--color-success);font-weight:600;" data-obj-count>
            ${DETECTED_OBJECTS.length} OBJECTS TRACKED
        </p>`
    );
}

function renderEnvironmentTablet(host, step, controller, bus) {
    const s = SCENARIOS.environment;
    // Working copy of objects for cycling
    const allObjects = [...DETECTED_OBJECTS.map(o => ({ ...o, visible: true })), ...EXTRA_OBJECTS.map(o => ({ ...o }))];
    let visibleCount = allObjects.filter(o => o.visible).length;

    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Riding · Environment</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <div class="perception-hud">
                ${buildPerceptionSVG(allObjects)}
                <div class="perception-count-badge">
                    <span class="perception-count-num" data-count>${visibleCount}</span>
                    <span class="perception-count-cap">Objects tracked</span>
                </div>
            </div>
            <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-top:var(--sp-2);">
                <span style="font-size:11px;color:#4ADE80;font-weight:600;">■ Vehicles</span>
                <span style="font-size:11px;color:#FBBF24;font-weight:600;">■ Pedestrians</span>
                <span style="font-size:11px;color:#60A5FA;font-weight:600;">■ Signs</span>
            </div>
            ${renderSafeZoneBar(0)}
            <div class="step-actions">
                ${tmShield(s.trust)}
                <button type="button" role="button" class="btn btn-primary" data-cta="next">
                    Next scenario
                </button>
            </div>
        </div>
    `;
    host.querySelector('[data-cta="next"]').addEventListener('click', () => controller.advance('riding-env-next'));

    // Object cycling every 4 seconds (Task 8.1)
    const cycleInterval = setInterval(() => {
        // Toggle 1-2 visible objects off
        const visible = allObjects.filter(o => o.visible);
        const hidden = allObjects.filter(o => !o.visible);
        const toggleOff = Math.min(Math.floor(Math.random() * 2) + 1, visible.length);
        for (let i = 0; i < toggleOff; i++) {
            const idx = Math.floor(Math.random() * visible.length);
            visible[idx].visible = false;
            visible.splice(idx, 1);
        }
        // Toggle 1-2 hidden objects on
        const toggleOn = Math.min(Math.floor(Math.random() * 2) + 1, hidden.length);
        for (let i = 0; i < toggleOn; i++) {
            const idx = Math.floor(Math.random() * hidden.length);
            hidden[idx].visible = true;
            hidden.splice(idx, 1);
        }

        // Re-render bounding boxes
        const container = host.querySelector('[data-bbox-container]');
        if (container) {
            const nowVisible = allObjects.filter(o => o.visible);
            container.innerHTML = nowVisible.map((obj, i) => `
                <g class="perception-bbox-enter" style="animation-delay:${150 + i * 150}ms;">
                    <rect class="perception-bbox is-${obj.type}"
                          x="${obj.x}" y="${obj.y}" width="${obj.w}" height="${obj.h}"/>
                    <text class="perception-label" x="${obj.x + 1}" y="${obj.y - 2}">${obj.label} ${obj.dist}</text>
                </g>
            `).join('');
            // Update count badge (Task 8.2)
            const countEl = host.querySelector('[data-count]');
            if (countEl) countEl.textContent = nowVisible.length;
        }
    }, 4000);

    // Cleanup on step change (Task 8.5)
    const stopCycle = bus.on('stepWillChange', () => { clearInterval(cycleInterval); stopCycle(); });
}



// ── Maneuver ──────────────────────────────────────────────────────────

function renderManeuverClusterQuiet(host) {
    baseCluster(host, 'maneuver',
        `${buildMiniPerceptionSVG()}
        ${renderSafeZoneBar(1)}`
    );
}

function renderManeuverClusterEvent(host) {
    baseCluster(host, 'maneuver',
        `${buildMiniPerceptionSVG()}
        ${renderSafeZoneBar(1)}
        <p class="t-caption" style="margin-top:var(--sp-2);color:var(--color-warning);font-weight:700;">LEFT TURN · Oak St</p>`
    );
}

function renderManeuverTablet(host, step, controller, bus) {
    const s = SCENARIOS.maneuver;
    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Riding · Maneuver preview</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <div data-preview style="padding:var(--sp-4);background:var(--color-accent-soft);border-radius:12px;">
                <p class="t-caption">Upcoming in 3 seconds</p>
                <p style="font-size:22px;font-weight:600;margin-top:var(--sp-2);">← Left turn · Oak St</p>
                <p class="t-caption">Slight brake, then turn. Nothing for you to do.</p>
            </div>
            ${renderSafeZoneBar(1)}
            <div class="step-actions">
                ${tmShield(s.trust)}
                <button type="button" role="button" class="btn btn-primary" data-cta="next">
                    Next scenario
                </button>
            </div>
        </div>
    `;
    host.querySelector('[data-cta="next"]').addEventListener('click', () => controller.advance('riding-maneuver-next'));

    const t = setTimeout(() => {
        bus.emit('timedEvent', { stepIndex: step.globalIndex, eventId: 'maneuver', payload: { ts: Date.now() } });
        const clusterHost = document.querySelector('section[aria-label="Dashboard cluster"][data-step-id="riding.maneuver"]')
            || document.querySelector('.cluster[data-step-id="riding.maneuver"]');
        if (clusterHost) renderManeuverClusterEvent(clusterHost);
    }, 3000);
    const stop = bus.on('stepWillChange', () => { clearTimeout(t); stop(); });
}

// ── Productive time ──────────────────────────────────────────────────

function renderProductiveCluster(host) {
    baseCluster(host, 'productive-time',
        `${buildMiniPerceptionSVG()}
        ${renderSafeZoneBar(2)}`
    );
}

function renderProductiveTablet(host, step, controller, bus) {
    const s = SCENARIOS['productive-time'];
    host.innerHTML = `
        <div class="tablet-step" data-productive-root>
            <p class="t-caption step-meta">Riding · Productive time</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <section aria-label="In-ride activity" data-activity-section style="padding:var(--sp-4);background:var(--color-surface-subtle);border-radius:12px;display:flex;flex-direction:column;gap:var(--sp-3);transition:background 500ms,border-color 500ms;">
                <p class="t-caption">Productive time · 22 min available</p>
                <article style="display:flex;gap:var(--sp-3);align-items:center;">
                    <span style="font-size:20px;">📧</span>
                    <span style="flex:1">Reply to 3 emails</span>
                    <span class="t-caption">5 min</span>
                </article>
                <article style="display:flex;gap:var(--sp-3);align-items:center;">
                    <span style="font-size:20px;">📅</span>
                    <span style="flex:1">Review today's calendar</span>
                    <span class="t-caption">2 min</span>
                </article>
                <article style="display:flex;gap:var(--sp-3);align-items:center;">
                    <span style="font-size:20px;">📚</span>
                    <span style="flex:1">Continue reading saved article</span>
                    <span class="t-caption">15 min</span>
                </article>
            </section>
            <div class="autonomy-budget-bar" data-budget-bar>
                <div class="autonomy-budget-fill" data-budget-fill style="width:100%;"></div>
            </div>
            ${renderSafeZoneBar(2)}
            <div class="step-actions">
                ${tmShield(s.trust)}
                <button type="button" role="button" class="btn btn-primary" data-cta="next">
                    Continue
                </button>
            </div>
        </div>
    `;
    host.querySelector('[data-cta="next"]').addEventListener('click', () => controller.advance('riding-productive-next'));

    // Smart Distraction Nudge — 8-second timer (Task 9)
    const nudgeTimer = setTimeout(() => {
        const root = host.querySelector('[data-productive-root]');
        const section = host.querySelector('[data-activity-section]');
        if (!root) return;

        // Inject nudge banner (Task 9.2)
        const banner = document.createElement('div');
        banner.className = 'nudge-banner';
        banner.innerHTML = `
            <span class="nudge-banner-icon">⚠️</span>
            <span class="nudge-banner-text">Road conditions changing — attention may be needed soon</span>
        `;
        if (section) {
            section.parentNode.insertBefore(banner, section);
            // Transition visual state (Task 9.3)
            section.style.background = 'rgba(180, 83, 9, 0.06)';
            section.style.borderColor = 'var(--color-warning)';
            section.style.border = '1px solid var(--color-warning)';
        }
        root.classList.add('nudge-active');

        // Update cluster alert pill (Task 9.4)
        const clusterPill = document.querySelector('[data-cluster-pill]');
        if (clusterPill) {
            clusterPill.textContent = 'ATTENTION';
            clusterPill.className = 'cluster-alert-pill is-warning';
        }

        // Animate autonomy budget decrease (Task 9.5)
        const budgetFill = host.querySelector('[data-budget-fill]');
        if (budgetFill) {
            budgetFill.style.width = '35%';
            budgetFill.style.background = 'var(--color-warning)';
        }
    }, 8000);

    // Cancel timer on step change (Task 9.6)
    const stopNudge = bus.on('stepWillChange', () => { clearTimeout(nudgeTimer); stopNudge(); });
}

// ── Exports ──────────────────────────────────────────────────────────

export function makeRidingSteps({ controller, bus }) {
    return [
        {
            id: 'riding.intro',
            stage: 'riding', slug: 'intro',
            label: 'Riding intro', title: 'Entering Passenger Mode',
            trustMoments: [],
            renderCluster: (host) => renderRidingIntroCluster(host),
            renderTablet: (host, step) => renderRidingIntroTablet(host, step, controller, bus),
        },
        {
            id: 'riding.environment',
            stage: 'riding', slug: 'environment',
            label: 'Environment', title: SCENARIOS.environment.title,
            trustMoments: [SCENARIOS.environment.trust],
            renderCluster: (host) => renderEnvironmentCluster(host),
            renderTablet: (host, step) => renderEnvironmentTablet(host, step, controller, bus),
        },
        {
            id: 'riding.maneuver',
            stage: 'riding', slug: 'maneuver',
            label: 'Maneuver', title: SCENARIOS.maneuver.title,
            trustMoments: [SCENARIOS.maneuver.trust],
            timedEvents: [{ id: 'maneuver', atMs: 3000 }],
            renderCluster: (host) => renderManeuverClusterQuiet(host),
            renderTablet: (host, step) => renderManeuverTablet(host, step, controller, bus),
        },
        {
            id: 'riding.productive-time',
            stage: 'riding', slug: 'productive-time',
            label: 'Productive time', title: SCENARIOS['productive-time'].title,
            trustMoments: [SCENARIOS['productive-time'].trust],
            renderCluster: (host) => renderProductiveCluster(host),
            renderTablet: (host, step) => renderProductiveTablet(host, step, controller, bus),
        },
    ];
}
