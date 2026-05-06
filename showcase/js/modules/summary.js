/**
 * Summary module — recap of every Trust_Moment encountered, grouped by stage.
 * See design.md "Stage-specific designs — Summary" and requirements Req 11.
 */
import { RESEARCH_GOAL } from './intro.js';

const STAGE_LABELS = {
    onboarding: 'Onboarding',
    driving: 'Driving',
    riding: 'Riding',
};

export function makeSummaryStep({ controller, steps }) {
    function renderCluster(host) {
        host.innerHTML = `
            <div class="cluster-title">
                <span class="t-caption cluster-context">Showcase · Complete</span>
                <span class="cluster-autonomy" style="background:var(--color-success);color:var(--color-text-on-accent);">DONE</span>
            </div>
            <div style="margin-top:var(--sp-4);">
                <span class="cluster-alert-pill is-success">COMPLETE</span>
            </div>
            <p class="t-caption cluster-context" style="margin-top:var(--sp-3);">Thanks for walking through AeroDrive.</p>
        `;
    }

    function renderTablet(host) {
        // Aggregate trust moments grouped by stage in registry order.
        const grouped = {};
        for (const s of steps) {
            if (!s.trustMoments || s.trustMoments.length === 0) continue;
            if (!STAGE_LABELS[s.stage]) continue; // skip intro / summary
            if (!grouped[s.stage]) grouped[s.stage] = [];
            for (const tm of s.trustMoments) grouped[s.stage].push(tm);
        }

        const groupsHtml = Object.keys(STAGE_LABELS)
            .filter(stage => grouped[stage] && grouped[stage].length > 0)
            .map(stage => `
                <section class="stage-group" aria-label="${STAGE_LABELS[stage]} trust moments">
                    <p class="t-caption stage-title">${STAGE_LABELS[stage]}</p>
                    <ul>
                        ${grouped[stage].map(tm => `<li>${tm.text}</li>`).join('')}
                    </ul>
                </section>
            `).join('');

        host.innerHTML = `
            <div class="tablet-step">
                <p class="t-caption step-meta">Summary · Recap</p>
                <h1 class="t-display">Trust, in motion.</h1>
                <p class="t-subhead">${RESEARCH_GOAL}</p>
                <div class="summary-recap">
                    ${groupsHtml || '<p class="t-caption">No trust moments recorded yet.</p>'}
                </div>
                <div class="step-actions">
                    <button type="button" role="button" class="btn btn-primary" data-cta="restart">
                        Restart showcase
                    </button>
                </div>
            </div>
        `;
        host.querySelector('[data-cta="restart"]').addEventListener('click', () =>
            controller.goTo(0, 'summary-restart')
        );
    }

    return {
        id: 'summary.recap',
        stage: 'summary', slug: 'recap',
        label: 'Recap', title: 'Trust, in motion',
        trustMoments: [],
        renderCluster,
        renderTablet,
    };
}
