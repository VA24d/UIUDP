// Feature: unified-av-showcase, Property 5: Timeline visual state monotonicity
// Feature: unified-av-showcase, Property 6: Timeline node count equals step count
// Feature: unified-av-showcase, Property 7: Timeline accessible name completeness
// Feature: unified-av-showcase, Property 8: Timeline tab order matches registry order
// Feature: unified-av-showcase, Property 9 (click half): Node activation by click

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { createBus } from '../../js/core/event-bus.js';
import { createStageController } from '../../js/core/stage-controller.js';
import { createTimeline } from '../../js/core/timeline.js';

function makeSteps(n) {
    const stages = ['intro', 'onboarding', 'driving', 'riding', 'summary'];
    return Array.from({ length: n }, (_, i) => ({
        id: `step.${i}`,
        globalIndex: i,
        stage: stages[i % stages.length],
        slug: `slug-${i}`,
        label: `Label${i}`,
        title: `Title ${i}`,
        trustMoments: [],
    }));
}

function setup(n) {
    document.body.innerHTML = '<nav id="tl"></nav>';
    const host = document.getElementById('tl');
    const bus = createBus();
    const steps = makeSteps(n);
    const controller = createStageController({ bus, steps });
    const tl = createTimeline({ bus, steps, controller, host });
    return { bus, steps, controller, host, tl };
}

describe('Property 5: Timeline visual state monotonicity', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('each node is exactly one of is-filled / is-active / is-unfilled per rule', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 10 }).chain(n =>
                    fc.tuple(fc.constant(n), fc.integer({ min: 0, max: n - 1 }))
                ),
                ([n, N]) => {
                    const { controller, host } = setup(n);
                    controller.goTo(N, 'test');
                    const nodes = Array.from(host.querySelectorAll('.tl-node'));
                    expect(nodes).toHaveLength(n);
                    for (let i = 0; i < n; i++) {
                        const cls = nodes[i].classList;
                        const has = {
                            filled: cls.contains('is-filled'),
                            active: cls.contains('is-active'),
                            unfilled: cls.contains('is-unfilled'),
                        };
                        const count = (has.filled ? 1 : 0) + (has.active ? 1 : 0) + (has.unfilled ? 1 : 0);
                        expect(count).toBe(1);
                        if (i < N) expect(has.filled).toBe(true);
                        else if (i === N) expect(has.active).toBe(true);
                        else expect(has.unfilled).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Property 6: Timeline node count equals step count', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('DOM contains exactly steps.length .tl-node elements within list > listitem', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 20 }), (n) => {
                const { host } = setup(n);
                const nodes = host.querySelectorAll('[role="list"] > [role="listitem"] > button.tl-node');
                expect(nodes.length).toBe(n);
            }),
            { numRuns: 100 }
        );
    });
});

describe('Property 7: Timeline accessible name completeness', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('every node aria-label contains both stage and label substrings', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 15 }), (n) => {
                const { steps, host } = setup(n);
                const nodes = Array.from(host.querySelectorAll('.tl-node'));
                for (let i = 0; i < n; i++) {
                    const ariaLabel = nodes[i].getAttribute('aria-label') || '';
                    expect(ariaLabel).toContain(steps[i].stage);
                    expect(ariaLabel).toContain(steps[i].label);
                }
            }),
            { numRuns: 50 }
        );
    });
});

describe('Property 8: Timeline tab order matches registry order', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('DOM order of .tl-node equals registry order and each node is focusable', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 15 }), (n) => {
                const { steps, host } = setup(n);
                const nodes = Array.from(host.querySelectorAll('.tl-node'));
                for (let i = 0; i < n; i++) {
                    expect(Number(nodes[i].dataset.index)).toBe(i);
                    expect(nodes[i].dataset.stage).toBe(steps[i].stage);
                    const tabindex = Number(nodes[i].getAttribute('tabindex') || '0');
                    expect(tabindex).toBeGreaterThanOrEqual(0);
                }
            }),
            { numRuns: 50 }
        );
    });
});

describe('Property 9 (click half): Node activation by click', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('clicking node j sets active index to j', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 10 }).chain(n =>
                    fc.tuple(
                        fc.constant(n),
                        fc.integer({ min: 0, max: n - 1 }),
                        fc.integer({ min: 0, max: n - 1 })
                    )
                ),
                ([n, i, j]) => {
                    const { controller, host } = setup(n);
                    controller.goTo(i, 'setup');
                    const nodes = Array.from(host.querySelectorAll('.tl-node'));
                    nodes[j].click();
                    expect(controller.getActiveIndex()).toBe(j);
                }
            ),
            { numRuns: 100 }
        );
    });
});
