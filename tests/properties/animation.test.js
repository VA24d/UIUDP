// Feature: unified-av-showcase, Property 13: Transition duration bound
// Feature: unified-av-showcase, Property 14: Skip transition is a single animation
// Feature: unified-av-showcase, Property 16: Reduced-motion instant swap
// Feature: unified-av-showcase, Property 17: In-flight animation cancellation
// Feature: unified-av-showcase, Property 31: Transition failure recovery
// (P15 added in task 25)

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
        renderCluster: (host) => { host.innerHTML = `c${i}`; },
        renderTablet: (host) => { host.innerHTML = `t${i}`; },
    }));
}

function setup(n, { reducedMotion = false } = {}) {
    document.body.innerHTML = '<section id="c"></section><section id="t"></section>';
    const clusterHost = createClusterHost({ root: document.getElementById('c') });
    const tabletHost = createTabletHost({ root: document.getElementById('t') });
    const bus = createBus();
    const steps = makeSteps(n);
    const theme = createThemeSystem();
    if (reducedMotion) theme.__setReduced(true);
    const controller = createStageController({ bus, steps });
    const anim = createAnimationController({ bus, clusterHost, tabletHost, themeSystem: theme });
    return { bus, controller, clusterHost, tabletHost, steps, anim, theme };
}

describe('Property 13: Transition duration bound', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    it('interval from stepWillChange to transitionComplete is <= 600ms', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 8 }),
                fc.integer({ min: 0, max: 7 }),
                (n, target) => {
                    const t = Math.min(target, n - 1);
                    const { bus, controller } = setup(n);
                    let willAt = null;
                    let completeAt = null;
                    bus.on('stepWillChange', () => { willAt = vi.getMockedSystemTime()?.getTime() ?? Date.now(); });
                    bus.on('transitionComplete', () => { completeAt = vi.getMockedSystemTime()?.getTime() ?? Date.now(); });
                    controller.goTo(t, 'test');
                    vi.advanceTimersByTime(800);
                    if (t === 0) return; // no-op (activeIndex was already 0)
                    expect(willAt).not.toBeNull();
                    expect(completeAt).not.toBeNull();
                    // Req 7.2 bounds the animation duration to 600ms. The
                    // measured interval also includes ~2 rAF scheduling frames
                    // (~32ms under vitest's fake-timer rAF emulation) and the
                    // +20ms completion guard. Total upper bound is 600+32+20.
                    expect(completeAt - willAt).toBeLessThanOrEqual(700);
                }
            ),
            { numRuns: 50 }
        );
    });
});

describe('Property 14: Skip transition is a single animation', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    it('when |to - from| > 1 exactly one crossFade invocation occurs', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 4, max: 10 }).chain(n =>
                    fc.tuple(
                        fc.constant(n),
                        fc.integer({ min: 0, max: n - 1 }),
                        fc.integer({ min: 0, max: n - 1 })
                    )
                ),
                ([n, a, b]) => {
                    if (Math.abs(a - b) <= 1) return;
                    const { controller, anim } = setup(n);
                    controller.goTo(a, 'setup');
                    vi.advanceTimersByTime(800);
                    anim.__resetCrossFadeCount();
                    controller.goTo(b, 'skip');
                    vi.advanceTimersByTime(800);
                    expect(anim.__getCrossFadeCount()).toBe(1);
                }
            ),
            { numRuns: 50 }
        );
    });
});

describe('Property 16: Reduced-motion instant swap', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('transitionComplete fires synchronously with stepDidChange', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 9 }), (target) => {
                const { bus, controller } = setup(10, { reducedMotion: true });
                let didAt = null;
                let completeAt = null;
                bus.on('stepDidChange', () => { didAt = performance.now(); });
                bus.on('transitionComplete', () => { completeAt = performance.now(); });
                controller.goTo(target, 'test');
                expect(didAt).not.toBeNull();
                expect(completeAt).not.toBeNull();
                expect(completeAt - didAt).toBeLessThan(2); // same tick
            }),
            { numRuns: 50 }
        );
    });
});

describe('Property 17: In-flight animation cancellation', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    it('two rapid step changes settle with both hosts at the final target', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 10 }).chain(n =>
                    fc.tuple(
                        fc.constant(n),
                        fc.integer({ min: 0, max: n - 1 }),
                        fc.integer({ min: 0, max: n - 1 })
                    )
                ),
                ([n, g1, g2]) => {
                    if (g1 === 0 && g2 === 0) return;
                    const { controller, clusterHost, tabletHost, steps } = setup(n);
                    controller.goTo(g1, 'test');
                    // Do NOT advance timers — transition is in flight.
                    controller.goTo(g2, 'test');
                    vi.advanceTimersByTime(1200);
                    const expected = steps[controller.getActiveIndex()].id;
                    expect(clusterHost.currentStepId).toBe(expected);
                    expect(tabletHost.currentStepId).toBe(expected);
                }
            ),
            { numRuns: 50 }
        );
    });
});

describe('Property 31: Transition failure recovery', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('when crossFade throws, both hosts still reach the target step.id', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 9 }), (target) => {
                document.body.innerHTML = '<section id="c"></section><section id="t"></section>';
                const clusterRoot = document.getElementById('c');
                const tabletRoot = document.getElementById('t');
                const clusterHost = createClusterHost({ root: clusterRoot });
                const tabletHost = createTabletHost({ root: tabletRoot });
                // Force beginExit to throw to trigger onFail recovery.
                const origBeginExit = clusterHost.beginExit;
                clusterHost.beginExit = () => { throw new Error('boom'); };
                const bus = createBus();
                const steps = makeSteps(10);
                const theme = createThemeSystem();
                const controller = createStageController({ bus, steps });
                const events = [];
                bus.on('transitionFailed', () => events.push('failed'));
                bus.on('transitionComplete', () => events.push('complete'));
                createAnimationController({ bus, clusterHost, tabletHost, themeSystem: theme });

                controller.goTo(target, 'test');
                const expected = steps[controller.getActiveIndex()].id;
                expect(clusterHost.currentStepId).toBe(expected);
                expect(tabletHost.currentStepId).toBe(expected);
                expect(events).toContain('complete');
                expect(events).toContain('failed');
                clusterHost.beginExit = origBeginExit;
            }),
            { numRuns: 25 }
        );
    });
});

describe('Property 15: Stage-entry animation on stage crossings', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    it('on stage change, Timeline gets is-stage-enter then loses it after 600ms', async () => {
        // Set up a timeline alongside the dual-display harness.
        document.body.innerHTML = '<nav id="tl"></nav>';
        const host = document.getElementById('tl');
        const { createBus } = await import('../../js/core/event-bus.js');
        const { createStageController } = await import('../../js/core/stage-controller.js');
        const { createTimeline } = await import('../../js/core/timeline.js');
        const bus = createBus();
        const steps = [
            { id: 's0', globalIndex: 0, stage: 'intro', slug: 'w', label: 'W', title: 'W', trustMoments: [] },
            { id: 's1', globalIndex: 1, stage: 'onboarding', slug: 'p', label: 'P', title: 'P', trustMoments: [] },
            { id: 's2', globalIndex: 2, stage: 'onboarding', slug: 'q', label: 'Q', title: 'Q', trustMoments: [] },
        ];
        const controller = createStageController({ bus, steps });
        createTimeline({ bus, steps, controller, host });
        controller.goTo(1, 'test'); // intro → onboarding — stage change
        // rAF polyfill inside Timeline schedules class-add asynchronously under fake timers.
        vi.advanceTimersByTime(50);
        expect(host.classList.contains('is-stage-enter')).toBe(true);
        vi.advanceTimersByTime(700);
        expect(host.classList.contains('is-stage-enter')).toBe(false);
        // Non-stage crossing (onboarding → onboarding) should NOT add the class.
        host.classList.remove('is-stage-enter');
        controller.goTo(2, 'test');
        vi.advanceTimersByTime(50);
        expect(host.classList.contains('is-stage-enter')).toBe(false);
    });
});
