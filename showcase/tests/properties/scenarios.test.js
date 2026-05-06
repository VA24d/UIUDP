// Feature: unified-av-showcase, Property 22: Fatigue escalation levels are distinct
// Feature: unified-av-showcase, Property 24: Maneuver preview lead time
// Feature: unified-av-showcase, Property 25: Summary includes every trust moment

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { FATIGUE_LEVELS } from '../../js/modules/driving.js';
import { buildFullStepsHarness } from '../fixtures/build-steps.js';

describe('Property 22: Fatigue escalation levels are distinct', () => {
    it('for any two distinct levels a, b the class list differs by at least one class', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: FATIGUE_LEVELS.length - 1 }),
                fc.integer({ min: 0, max: FATIGUE_LEVELS.length - 1 }),
                (a, b) => {
                    if (a === b) return;
                    const classesA = new Set(FATIGUE_LEVELS[a].klass.split(' '));
                    const classesB = new Set(FATIGUE_LEVELS[b].klass.split(' '));
                    const symDiff = [...classesA].filter(x => !classesB.has(x))
                        .concat([...classesB].filter(x => !classesA.has(x)));
                    expect(symDiff.length).toBeGreaterThanOrEqual(1);
                }
            ),
            { numRuns: 50 }
        );
    });
});

describe('Property 24: Maneuver preview lead time', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    it('cluster maneuver event timestamp is >= preview timestamp + 3000ms', () => {
        const { steps, bus } = buildFullStepsHarness();
        const maneuver = steps.find(s => s.id === 'riding.maneuver');
        expect(maneuver).toBeDefined();

        document.body.innerHTML = '<section id="c" class="cluster" aria-label="Dashboard cluster" data-step-id="riding.maneuver"></section><section id="t"></section>';
        const cluster = document.getElementById('c');
        const tablet = document.getElementById('t');

        let tPreview = null;
        let tEvent = null;
        const startedAt = Date.now();
        vi.setSystemTime(startedAt);
        maneuver.renderCluster(cluster, maneuver);
        maneuver.renderTablet(tablet, maneuver);
        tPreview = Date.now();
        bus.on('timedEvent', (ev) => {
            if (ev.eventId === 'maneuver') tEvent = Date.now();
        });

        vi.advanceTimersByTime(3001);
        expect(tEvent).not.toBeNull();
        expect(tEvent - tPreview).toBeGreaterThanOrEqual(3000);
    });
});

describe('Property 25: Summary includes every trust moment', () => {
    beforeEach(() => { document.body.innerHTML = ''; });

    it('every declared TrustMoment text appears in the summary tablet render', () => {
        const { steps } = buildFullStepsHarness();
        const summary = steps.find(s => s.stage === 'summary');
        expect(summary).toBeDefined();
        document.body.innerHTML = '<section id="t"></section>';
        const tablet = document.getElementById('t');
        summary.renderTablet(tablet, summary);

        const allMoments = [];
        for (const s of steps) {
            if (s.stage === 'summary' || s.stage === 'intro') continue;
            for (const tm of (s.trustMoments || [])) allMoments.push(tm);
        }
        expect(allMoments.length).toBeGreaterThan(0);
        fc.assert(
            fc.property(fc.integer({ min: 0, max: allMoments.length - 1 }), (i) => {
                const tm = allMoments[i];
                expect(tablet.textContent, `missing: ${tm.text}`).toContain(tm.text);
            }),
            { numRuns: allMoments.length }
        );
    });
});
