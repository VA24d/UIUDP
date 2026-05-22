// Feature: unified-av-showcase, Property 32: Per-step render budget

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { createBus } from '../../js/core/event-bus.js';
import { createStageController } from '../../js/core/stage-controller.js';
import { createClusterHost } from '../../js/core/cluster-host.js';
import { createTabletHost } from '../../js/core/tablet-host.js';
import { createAnimationController } from '../../js/core/animation-controller.js';
import { createThemeSystem } from '../../js/core/theme-system.js';
import { buildFullStepsHarness } from '../fixtures/build-steps.js';

describe('Property 32: Per-step render budget', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('render interval from setActive call to both hosts data-step-id === step.id is <= 200ms (reduced-motion path)', () => {
        // Reduced-motion forces the synchronous render path, which is the best
        // proxy for "typical laptop" budget under a jsdom harness.
        const { steps } = buildFullStepsHarness();
        fc.assert(
            fc.property(fc.integer({ min: 0, max: steps.length - 1 }), (i) => {
                document.body.innerHTML = '<section id="c"></section><section id="t"></section>';
                const bus = createBus();
                const controller = createStageController({ bus, steps });
                const clusterHost = createClusterHost({ root: document.getElementById('c') });
                const tabletHost = createTabletHost({ root: document.getElementById('t') });
                const theme = createThemeSystem();
                theme.__setReduced(true);
                createAnimationController({ bus, clusterHost, tabletHost, themeSystem: theme });
                clusterHost.render(steps[0]);
                tabletHost.render(steps[0]);
                const t0 = performance.now();
                controller.goTo(i, 'test');
                const elapsed = performance.now() - t0;
                expect(elapsed).toBeLessThanOrEqual(200);
                if (i !== 0) {
                    expect(clusterHost.currentStepId).toBe(steps[i].id);
                    expect(tabletHost.currentStepId).toBe(steps[i].id);
                }
            }),
            { numRuns: 30 }
        );
    });

    it('smoke: initial render of the Intro step completes well under 2 seconds', () => {
        const { steps } = buildFullStepsHarness();
        document.body.innerHTML = '<section id="c"></section><section id="t"></section>';
        const clusterHost = createClusterHost({ root: document.getElementById('c') });
        const tabletHost = createTabletHost({ root: document.getElementById('t') });
        const t0 = performance.now();
        clusterHost.render(steps[0]);
        tabletHost.render(steps[0]);
        const elapsed = performance.now() - t0;
        expect(elapsed).toBeLessThan(2000);
    });
});
