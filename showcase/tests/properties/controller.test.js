// Feature: unified-av-showcase, Property 3: Navigation boundary no-op
// Feature: unified-av-showcase, Property 4: Navigation clamp and step semantics
// Feature: unified-av-showcase, Property 29: Trust-count correctness and monotonicity
// Feature: unified-av-showcase, Property 30: Reachability via advance and retreat only

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createBus } from '../../js/core/event-bus.js';
import { createStageController } from '../../js/core/stage-controller.js';

/** Build a deterministic step list with configurable trust-moment counts. */
function makeSteps(count, tmPerStep = () => 1) {
    const stages = ['intro', 'onboarding', 'driving', 'riding', 'summary'];
    return Array.from({ length: count }, (_, i) => ({
        id: `step.${i}`,
        globalIndex: i,
        stage: stages[i % stages.length],
        slug: `slug-${i}`,
        label: `L${i}`,
        title: `T${i}`,
        trustMoments: Array.from({ length: tmPerStep(i) }, (_, j) => ({
            id: `tm.${i}.${j}`,
            text: `TM ${i}.${j}`,
        })),
    }));
}

function make(n, tmPerStep) {
    const bus = createBus();
    const steps = makeSteps(n, tmPerStep);
    const controller = createStageController({ bus, steps });
    return { bus, steps, controller };
}

describe('Property 3: Navigation boundary no-op', () => {
    it('advance at lastIndex is a no-op with changed === false', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 15 }),
                fc.constantFrom('api', 'advance', 'arrow-key', 'timeline', 'digit-key'),
                (n, src) => {
                    const { controller } = make(n);
                    // Skip to lastIndex
                    controller.goTo(n - 1, 'setup');
                    const before = controller.getActiveIndex();
                    const result = controller.advance(src);
                    expect(result.changed).toBe(false);
                    expect(controller.getActiveIndex()).toBe(before);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('retreat at 0 is a no-op with changed === false', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 15 }),
                fc.constantFrom('api', 'retreat', 'arrow-key', 'timeline'),
                (n, src) => {
                    const { controller } = make(n);
                    const result = controller.retreat(src);
                    expect(result.changed).toBe(false);
                    expect(controller.getActiveIndex()).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Property 4: Navigation clamp and step semantics', () => {
    it('advance yields min(i+1, lastIndex)', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 15 }).chain(n =>
                    fc.tuple(fc.constant(n), fc.integer({ min: 0, max: n - 1 }))
                ),
                fc.constantFrom('api', 'arrow-key'),
                ([n, i], src) => {
                    const { controller } = make(n);
                    controller.goTo(i, 'setup');
                    controller.advance(src);
                    expect(controller.getActiveIndex()).toBe(Math.min(i + 1, n - 1));
                }
            ),
            { numRuns: 100 }
        );
    });

    it('retreat yields max(i-1, 0)', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 15 }).chain(n =>
                    fc.tuple(fc.constant(n), fc.integer({ min: 0, max: n - 1 }))
                ),
                fc.constantFrom('api', 'arrow-key'),
                ([n, i], src) => {
                    const { controller } = make(n);
                    controller.goTo(i, 'setup');
                    controller.retreat(src);
                    expect(controller.getActiveIndex()).toBe(Math.max(i - 1, 0));
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Property 29: Trust-count correctness and monotonicity', () => {
    it('trust count is the sum of trustMoments over the high-water-mark set', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 12 }).chain(n =>
                    fc.tuple(
                        fc.constant(n),
                        fc.array(
                            fc.record({
                                kind: fc.constantFrom('advance', 'retreat', 'goTo'),
                                target: fc.integer({ min: 0, max: n - 1 }),
                            }),
                            { minLength: 1, maxLength: 30 }
                        )
                    )
                ),
                ([n, actions]) => {
                    const { controller, steps } = make(n, i => (i % 3) + 1);
                    let expectedHighWater = new Set();
                    let prevCount = 0;
                    for (const act of actions) {
                        const from = controller.getActiveIndex();
                        let to = from;
                        if (act.kind === 'advance') to = Math.min(from + 1, n - 1);
                        else if (act.kind === 'retreat') to = Math.max(from - 1, 0);
                        else to = act.target;
                        // Perform action
                        if (act.kind === 'advance') controller.advance('test');
                        else if (act.kind === 'retreat') controller.retreat('test');
                        else controller.goTo(to, 'test');
                        // Expected: any forward/forward-skip adds [0..to] into the set
                        if (to > from) {
                            for (let i = 0; i <= to; i++) expectedHighWater.add(i);
                        }
                        const currentCount = controller.getTrustCount();
                        // Monotonically non-decreasing
                        expect(currentCount).toBeGreaterThanOrEqual(prevCount);
                        prevCount = currentCount;
                    }
                    // Final count equals sum over expectedHighWater
                    let expected = 0;
                    for (const i of expectedHighWater) expected += steps[i].trustMoments.length;
                    expect(controller.getTrustCount()).toBe(expected);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('backward move never changes the trust count', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 10 }),
                (n) => {
                    const { controller } = make(n);
                    controller.goTo(n - 1, 'test'); // forward skip counts everything
                    const before = controller.getTrustCount();
                    for (let i = n - 2; i >= 0; i--) {
                        controller.retreat('test');
                        expect(controller.getTrustCount()).toBe(before);
                    }
                }
            ),
            { numRuns: 50 }
        );
    });
});

describe('Property 30: Reachability via advance and retreat only', () => {
    it('from any A, a finite advance/retreat sequence reaches any B', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 14 }).chain(n =>
                    fc.tuple(
                        fc.constant(n),
                        fc.integer({ min: 0, max: n - 1 }),
                        fc.integer({ min: 0, max: n - 1 })
                    )
                ),
                ([n, a, b]) => {
                    const { controller } = make(n);
                    controller.goTo(a, 'setup');
                    expect(controller.getActiveIndex()).toBe(a);
                    // Walk step-by-step using only advance/retreat
                    const delta = b - a;
                    const fn = delta >= 0 ? controller.advance : controller.retreat;
                    for (let i = 0; i < Math.abs(delta); i++) fn('test');
                    expect(controller.getActiveIndex()).toBe(b);
                }
            ),
            { numRuns: 100 }
        );
    });
});
