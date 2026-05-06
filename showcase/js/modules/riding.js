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
            <span class="cluster-alert-pill is-success">SERENE</span>
        </div>
        ${extra}
    `;
}

function tmShield(tm) { return tm ? `<span class="trust-moment">${tm.text}</span>` : ''; }

// ── Environment ───────────────────────────────────────────────────────

function renderEnvironmentCluster(host) { baseCluster(host, 'environment'); }

function renderEnvironmentTablet(host, step, controller) {
    const s = SCENARIOS.environment;
    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Riding · Environment</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <div class="ambient-grid" data-ambient>
                <div class="ambient-tile"><p class="tile-cap t-caption">Weather</p><p class="tile-val">Clear · 19 °C</p></div>
                <div class="ambient-tile"><p class="tile-cap t-caption">Cabin</p><p class="tile-val">21 °C · Quiet</p></div>
                <div class="ambient-tile"><p class="tile-cap t-caption">Air quality</p><p class="tile-val">● ● ● ○</p></div>
                <div class="ambient-tile"><p class="tile-cap t-caption">Ambient light</p><p class="tile-val">Soft amber</p></div>
            </div>
            <div class="step-actions">
                ${tmShield(s.trust)}
                <button type="button" role="button" class="btn btn-primary" data-cta="next">
                    Next scenario
                </button>
            </div>
        </div>
    `;
    host.querySelector('[data-cta="next"]').addEventListener('click', () => controller.advance('riding-env-next'));
}

// ── Maneuver ──────────────────────────────────────────────────────────

function renderManeuverClusterQuiet(host) { baseCluster(host, 'maneuver'); }

function renderManeuverClusterEvent(host) {
    baseCluster(host, 'maneuver',
        '<p class="t-caption" style="margin-top:var(--sp-2);color:var(--color-warning);font-weight:700;">LEFT TURN · Oak St</p>'
    );
}

function renderManeuverTablet(host, step, controller, bus) {
    const s = SCENARIOS.maneuver;
    // Tablet renders the preview immediately (t=0).
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
            <div class="step-actions">
                ${tmShield(s.trust)}
                <button type="button" role="button" class="btn btn-primary" data-cta="next">
                    Next scenario
                </button>
            </div>
        </div>
    `;
    host.querySelector('[data-cta="next"]').addEventListener('click', () => controller.advance('riding-maneuver-next'));

    // Emit the cluster-facing event 3 seconds after the preview renders (Req 10.4).
    // Cluster host does NOT re-render on the timed event by default; we listen
    // here and mutate the cluster DOM directly so both surfaces tick in unison.
    const t = setTimeout(() => {
        bus.emit('timedEvent', { stepIndex: step.globalIndex, eventId: 'maneuver', payload: { ts: Date.now() } });
        // Swap the cluster to its "event" banner state.
        const cluster = document.querySelector('[data-step-id="riding.maneuver"]');
        // Could be either cluster or tablet — look for the cluster-specific class.
        const clusterHost = document.querySelector('section[aria-label="Dashboard cluster"][data-step-id="riding.maneuver"]')
            || document.querySelector('.cluster[data-step-id="riding.maneuver"]');
        if (clusterHost) renderManeuverClusterEvent(clusterHost);
    }, 3000);
    const stop = bus.on('stepWillChange', () => { clearTimeout(t); stop(); });
}

// ── Productive time ──────────────────────────────────────────────────

function renderProductiveCluster(host) { baseCluster(host, 'productive-time'); }

function renderProductiveTablet(host, step, controller) {
    const s = SCENARIOS['productive-time'];
    host.innerHTML = `
        <div class="tablet-step">
            <p class="t-caption step-meta">Riding · Productive time</p>
            <h2 class="step-title">${s.title}</h2>
            <p class="step-purpose">${s.intent}</p>
            <section aria-label="In-ride activity" style="padding:var(--sp-4);background:var(--color-surface-subtle);border-radius:12px;display:flex;flex-direction:column;gap:var(--sp-3);">
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
            <div class="step-actions">
                ${tmShield(s.trust)}
                <button type="button" role="button" class="btn btn-primary" data-cta="next">
                    Continue
                </button>
            </div>
        </div>
    `;
    host.querySelector('[data-cta="next"]').addEventListener('click', () => controller.advance('riding-productive-next'));
}

// ── Exports ──────────────────────────────────────────────────────────

export function makeRidingSteps({ controller, bus }) {
    return [
        {
            id: 'riding.environment',
            stage: 'riding', slug: 'environment',
            label: 'Environment', title: SCENARIOS.environment.title,
            trustMoments: [SCENARIOS.environment.trust],
            renderCluster: (host) => renderEnvironmentCluster(host),
            renderTablet: (host, step) => renderEnvironmentTablet(host, step, controller),
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
            renderTablet: (host, step) => renderProductiveTablet(host, step, controller),
        },
    ];
}
