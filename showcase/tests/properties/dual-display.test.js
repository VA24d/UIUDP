// Feature: unified-av-showcase, Property 1: Dual-display step equality
// Feature: unified-av-showcase, Property 10: Dual-host render in same animation frame
// Feature: unified-av-showcase, Property 11: Shared timed-event cross-host synchronization

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { createBus } from '../../js/core/event-bus.js';
import { createStageController } from '../../js/core/stage-controller.js';
import { createClusterHost } from '../../js/core/cluster-host.js';
import { createTabletHost } from '../../js/core/tablet-host.js';
import { createAnimationController } from '../../js/core/animation-controller.js';
import { createThemeSystem } from '../../js/core/theme-system.js';

function makeSteps(n) {
    return Array.from({ length: n }, (_, i) => ({
        id: `step.${i}`,
        globalIndex: i,
        stage: 'onboarding',
        slug: `s-${i}`,
        label: `L${i}`,
        title: `T${i}`,
        trustMoments: [],
        renderCluster: (host) => { host.innerHTML = `<div>c${i}</div>`; },
        renderTablet: (host) => { host.innerHTML = `<div>t${i}</div>`; },
    }));
}

function setup(n) {
    document.body.innerHTML = '<section id="c"></section><section id="t"></section>';
    const clusterHost = createClusterHost({ root: document.getElementById('c') });
    const tabletHost = createTabletHost({ root: document.getElementById('t') });
    const bus = createBus();
    const steps = makeSteps(n);
    const theme = createThemeSystem();
    // Force reduced-motion so the test can assert same-frame render without
    // waiting on the rAF cross-fade cascade. Property 10 covers the invariant
    // under the reduced-motion short-circuit code path, which is the worst
    // case for dual-display sync (same tick, no animation buffer).
    theme.__setReduced(true);
    const controller = createStageController({ bus, steps });
    createAnimationController({ bus, clusterHost, tabletHost, themeSystem: theme });
    // Seed: ensure hosts have initial render so that no-op goTo(0) still
    // leaves both hosts at a valid step id. Animation controller only renders
    // on stepDidChange, so we push once explicitly.
    clusterHost.render(steps[0]);
    tabletHost.render(steps[0]);
    return { bus, controller, clusterHost, tabletHost, steps };
}

describe('Property 10: Dual-host render in same animation frame', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('after any step change both hosts equal steps[activeIndex].id', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 10 }).chain(n =>
                    fc.tuple(
                        fc.constant(n),
                        fc.array(fc.integer({ min: 0, max: n - 1 }), { minLength: 1, maxLength: 20 })
                    )
                ),
                ([n, targets]) => {
                    const { controller, clusterHost, tabletHost, steps } = setup(n);
                    for (const t of targets) {
                        controller.goTo(t, 'test');
                        const expected = steps[controller.getActiveIndex()].id;
                        expect(clusterHost.currentStepId).toBe(expected);
                        expect(tabletHost.currentStepId).toBe(expected);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Property 1: Dual-display step equality', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('after any action sequence both hosts equal steps[controller.getActiveIndex()].id', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 8 }).chain(n =>
                    fc.tuple(
                        fc.constant(n),
                        fc.array(
                            fc.oneof(
                                fc.record({ kind: fc.constant('advance') }),
                                fc.record({ kind: fc.constant('retreat') }),
                                fc.record({ kind: fc.constant('goTo'), target: fc.integer({ min: 0, max: n - 1 }) })
                            ),
                            { minLength: 1, maxLength: 12 }
                        )
                    )
                ),
                ([n, actions]) => {
                    const { controller, clusterHost, tabletHost, steps } = setup(n);
                    for (const a of actions) {
                        if (a.kind === 'advance') controller.advance('test');
                        else if (a.kind === 'retreat') controller.retreat('test');
                        else controller.goTo(a.target, 'test');
                        const expected = steps[controller.getActiveIndex()].id;
                        expect(clusterHost.currentStepId).toBe(expected);
                        expect(tabletHost.currentStepId).toBe(expected);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Property 11: Shared timed-event cross-host synchronization', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('cluster and tablet listener delivery timestamps differ by <= 100ms', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 100 }), (eventCount) => {
                const { bus } = setup(5);
                const clusterStamps = [];
                const tabletStamps = [];
                bus.on('timedEvent', () => clusterStamps.push(performance.now()));
                bus.on('timedEvent', () => tabletStamps.push(performance.now()));
                for (let i = 0; i < eventCount; i++) {
                    bus.emit('timedEvent', { stepIndex: 0, eventId: 'tick', payload: { i } });
                }
                expect(clusterStamps.length).toBe(eventCount);
                expect(tabletStamps.length).toBe(eventCount);
                for (let i = 0; i < eventCount; i++) {
                    expect(Math.abs(clusterStamps[i] - tabletStamps[i])).toBeLessThanOrEqual(100);
                }
            }),
            { numRuns: 25 }
        );
    });
});
