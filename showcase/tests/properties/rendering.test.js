// Feature: unified-av-showcase, Property 18: Onboarding step render shape
// Feature: unified-av-showcase, Property 21: Driving step render shape
// Feature: unified-av-showcase, Property 23: Riding passenger-mode indicator

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { buildFullStepsHarness } from '../fixtures/build-steps.js';

function renderIntoHosts(step) {
    document.body.innerHTML = '<section id="c"></section><section id="t"></section>';
    const cluster = document.getElementById('c');
    const tablet = document.getElementById('t');
    step.renderCluster(cluster, step);
    step.renderTablet(tablet, step);
    return { cluster, tablet };
}

describe('Property 18: Onboarding step render shape', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('for every onboarding step the tablet has a title heading, a purpose paragraph, and a primary button; cluster has status including label', () => {
        const { steps } = buildFullStepsHarness();
        const onboarding = steps.filter(s => s.stage === 'onboarding');
        fc.assert(
            fc.property(fc.integer({ min: 0, max: onboarding.length - 1 }), (i) => {
                const step = onboarding[i];
                const { cluster, tablet } = renderIntoHosts(step);
                const heading = tablet.querySelector('.step-title, h1');
                expect(heading, `step ${step.id} missing heading`).not.toBeNull();
                expect(heading.textContent.trim()).toContain(step.title);
                expect(tablet.querySelector('.step-purpose'), `step ${step.id} missing purpose`).not.toBeNull();
                const primary = tablet.querySelector('[role="button"]');
                expect(primary, `step ${step.id} missing primary role=button`).not.toBeNull();
                // Cluster status text includes s.label (case-insensitive, slug form).
                expect(cluster.textContent.toLowerCase()).toContain(step.label.toLowerCase());
            }),
            { numRuns: 30 }
        );
    });
});

describe('Property 21: Driving step render shape', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('for every driving step the tablet has title + intent; cluster has speed, autonomy, alert pill', () => {
        const { steps } = buildFullStepsHarness();
        const driving = steps.filter(s => s.stage === 'driving');
        fc.assert(
            fc.property(fc.integer({ min: 0, max: driving.length - 1 }), (i) => {
                const step = driving[i];
                const { cluster, tablet } = renderIntoHosts(step);
                const heading = tablet.querySelector('.step-title');
                expect(heading.textContent.trim()).toContain(step.title);
                // Distinct element for intent (the step-purpose copy).
                expect(tablet.querySelector('.step-purpose')).not.toBeNull();
                // Cluster shape.
                expect(cluster.querySelector('.cluster-speed')).not.toBeNull();
                expect(cluster.querySelector('.cluster-autonomy')).not.toBeNull();
                expect(cluster.querySelector('.cluster-alert-pill')).not.toBeNull();
            }),
            { numRuns: 30 }
        );
    });
});

describe('Property 23: Riding passenger-mode indicator', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('every riding step cluster contains a .cluster-passenger-pill matching /passenger/i', () => {
        const { steps } = buildFullStepsHarness();
        const riding = steps.filter(s => s.stage === 'riding');
        fc.assert(
            fc.property(fc.integer({ min: 0, max: riding.length - 1 }), (i) => {
                const step = riding[i];
                const { cluster } = renderIntoHosts(step);
                const pill = cluster.querySelector('.cluster-passenger-pill');
                expect(pill).not.toBeNull();
                expect(pill.textContent).toMatch(/passenger/i);
            }),
            { numRuns: 30 }
        );
    });
});
