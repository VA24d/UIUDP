/**
 * Tests for Nav Controls Bugfix (Task 1)
 * Validates: Requirements 2.1 — exactly one .nav child in nav-host
 *
 * Property 1: Bug Condition - Nav Controls Render Exactly One Set
 * For any step transition where transitionComplete fires, the .nav-host element
 * SHALL contain exactly one .nav child with at most one Back button (hidden on
 * first step) and one Next button (or end indicator on last step), regardless of
 * how many transitions have occurred.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { createBus } from '../../js/core/event-bus.js';
import { createStageController } from '../../js/core/stage-controller.js';
import { createNavControls } from '../../js/core/nav-controls.js';
import { STEPS } from '../../js/steps/registry.js';

function setup() {
    document.body.innerHTML = '<section id="nav-host"></section>';
    const bus = createBus();
    const controller = createStageController({ bus, steps: STEPS });
    const navHost = document.getElementById('nav-host');
    const nav = createNavControls({ bus, steps: STEPS, controller, tabletRoot: navHost });
    return { bus, controller, nav, navHost };
}

describe('Task 1: Nav Controls Multiple Back Button Bug', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    describe('1.1 Clear nav-host innerHTML before rendering, single bus listener', () => {
        it('nav-host contains exactly one .nav element after initial render', () => {
            const { navHost } = setup();
            const navElements = navHost.querySelectorAll('.nav');
            expect(navElements.length).toBe(1);
        });

        it('nav-host contains exactly one .nav element after multiple transitionComplete events', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 2, max: 20 }),
                    (numTransitions) => {
                        const { bus, navHost } = setup();
                        // Fire transitionComplete multiple times
                        for (let i = 0; i < numTransitions; i++) {
                            bus.emit('transitionComplete', {});
                        }
                        const navElements = navHost.querySelectorAll('.nav');
                        expect(navElements.length).toBe(1);
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('destroy() removes the bus listener so further events do not re-render', () => {
            const { bus, nav, navHost } = setup();
            nav.destroy();
            // Clear manually to test that no new nav is appended
            navHost.innerHTML = '';
            bus.emit('transitionComplete', {});
            const navElements = navHost.querySelectorAll('.nav');
            expect(navElements.length).toBe(0);
        });
    });

    describe('1.2 Guard prevents duplicate .nav elements on rapid-fire events', () => {
        it('rapid sequential transitionComplete events produce exactly one .nav', () => {
            const { bus, navHost } = setup();
            // Simulate rapid-fire events (as if multiple transitions fire in quick succession)
            for (let i = 0; i < 100; i++) {
                bus.emit('transitionComplete', {});
            }
            const navElements = navHost.querySelectorAll('.nav');
            expect(navElements.length).toBe(1);
        });

        it('for any sequence of step changes, nav-host always has exactly one .nav', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.integer({ min: 0, max: STEPS.length - 1 }), { minLength: 1, maxLength: 30 }),
                    (indices) => {
                        const { controller, bus, navHost, nav } = setup();
                        for (const idx of indices) {
                            controller.goTo(idx, 'test');
                            // Simulate what animation controller does after transition
                            bus.emit('transitionComplete', { toIndex: idx });
                        }
                        const navElements = navHost.querySelectorAll('.nav');
                        expect(navElements.length).toBe(1);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    describe('1.3 Back button hidden on first step, End of showcase on last step', () => {
        it('first step: no retreat button, has advance button', () => {
            const { controller, navHost } = setup();
            controller.goTo(0, 'test');
            const retreat = navHost.querySelector('[data-nav="retreat"]');
            const advance = navHost.querySelector('[data-nav="advance"]');
            expect(retreat).toBeNull();
            expect(advance).not.toBeNull();
        });

        it('last step: has retreat button, no advance button, has end indicator', () => {
            const { controller, bus, navHost, nav } = setup();
            const lastIndex = STEPS.length - 1;
            controller.goTo(lastIndex, 'test');
            // Sync nav after goTo (since no animation controller in test)
            nav.sync();
            const retreat = navHost.querySelector('[data-nav="retreat"]');
            const advance = navHost.querySelector('[data-nav="advance"]');
            const end = navHost.querySelector('[data-nav="end"]');
            expect(retreat).not.toBeNull();
            expect(advance).toBeNull();
            expect(end).not.toBeNull();
            expect(end.textContent).toBe('End of showcase');
        });

        it('for any step index, nav buttons follow the boundary rules', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: STEPS.length - 1 }),
                    (i) => {
                        const { controller, navHost, nav } = setup();
                        controller.goTo(i, 'test');
                        nav.sync();
                        const lastIndex = STEPS.length - 1;
                        const retreat = navHost.querySelector('[data-nav="retreat"]');
                        const advance = navHost.querySelector('[data-nav="advance"]');
                        const end = navHost.querySelector('[data-nav="end"]');

                        // First step: no retreat
                        if (i === 0) {
                            expect(retreat).toBeNull();
                        } else {
                            expect(retreat).not.toBeNull();
                            expect(retreat.textContent).toBe('← Back');
                        }

                        // Last step: end indicator instead of advance
                        if (i === lastIndex) {
                            expect(advance).toBeNull();
                            expect(end).not.toBeNull();
                            expect(end.textContent).toBe('End of showcase');
                        } else {
                            expect(advance).not.toBeNull();
                            expect(end).toBeNull();
                        }

                        // Always exactly one .nav element
                        const navElements = navHost.querySelectorAll('.nav');
                        expect(navElements.length).toBe(1);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
});
