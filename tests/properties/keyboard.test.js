// Feature: unified-av-showcase, Property 26: Digit-key stage jump
// Feature: unified-av-showcase, Property 9 (keyboard half): Node activation by Enter or Space
// Feature: unified-av-showcase, Property 27: Advance/retreat control presence

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { createBus } from '../../js/core/event-bus.js';
import { createStageController } from '../../js/core/stage-controller.js';
import { createTimeline } from '../../js/core/timeline.js';
import { createNavControls } from '../../js/core/nav-controls.js';
import { STEPS, STAGES, STAGE_FIRST_INDEX } from '../../js/steps/registry.js';

function setup() {
    document.body.innerHTML = '<nav id="tl"></nav><section id="tablet"></section>';
    const bus = createBus();
    const controller = createStageController({ bus, steps: STEPS });
    createTimeline({ bus, steps: STEPS, controller, host: document.getElementById('tl') });
    const nav = createNavControls({ bus, steps: STEPS, controller, tabletRoot: document.getElementById('tablet') });
    // Without an AnimationController nothing emits transitionComplete; sync
    // manually after every controller mutation.
    bus.on('stepDidChange', () => nav.sync());
    return { bus, controller };
}

describe('Property 26: Digit-key stage jump', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('pressing digit d sets active index to first index of d-th stage', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: STAGES.length }), (d) => {
                const { controller } = setup();
                const event = new KeyboardEvent('keydown', { key: String(d), bubbles: true });
                window.dispatchEvent(event);
                const stage = STAGES[d - 1];
                expect(controller.getActiveIndex()).toBe(STAGE_FIRST_INDEX[stage]);
            }),
            { numRuns: 50 }
        );
    });

    it('ArrowRight / ArrowLeft map to advance / retreat', () => {
        const { controller } = setup();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        expect(controller.getActiveIndex()).toBe(1);
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        expect(controller.getActiveIndex()).toBe(0);
    });
});

describe('Property 9 (keyboard half): Node activation by Enter or Space', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('Enter and Space on a node set active index to that node', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: STEPS.length - 1 }),
                fc.constantFrom('Enter', ' '),
                (j, key) => {
                    document.body.innerHTML = '<nav id="tl"></nav>';
                    const bus = createBus();
                    const controller = createStageController({ bus, steps: STEPS });
                    const host = document.getElementById('tl');
                    createTimeline({ bus, steps: STEPS, controller, host });
                    const nodes = Array.from(host.querySelectorAll('.tl-node'));
                    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
                    nodes[j].dispatchEvent(ev);
                    expect(controller.getActiveIndex()).toBe(j);
                }
            ),
            { numRuns: 50 }
        );
    });
});

describe('Property 27: Advance/retreat control presence', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('every non-last step renders an advance control; every non-first step renders a retreat control', () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: STEPS.length - 1 }), (i) => {
                const { controller } = setup();
                controller.goTo(i, 'test');
                const last = STEPS.length - 1;
                const hasAdvance = !!document.querySelector('[data-nav="advance"]');
                const hasRetreat = !!document.querySelector('[data-nav="retreat"]');
                const hasEnd = !!document.querySelector('[data-nav="end"]');
                if (i < last) expect(hasAdvance).toBe(true);
                else expect(hasEnd).toBe(true);
                if (i > 0) expect(hasRetreat).toBe(true);
                else expect(hasRetreat).toBe(false);
            }),
            { numRuns: 50 }
        );
    });
});
