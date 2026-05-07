// Example tests — riding steps
// Covers 3 riding scenarios: environment (Perception HUD), maneuver, productive-time.

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { makeRidingSteps } from '../../js/modules/riding.js';
import { buildRegistryWithOverrides } from '../../js/steps/registry.js';

function makeDOM() {
    const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    return window.document;
}
function makeController() {
    return { advance: () => {}, retreat: () => {}, goTo: () => {}, getActiveIndex: () => 0 };
}
function makeBus() {
    const listeners = {};
    return {
        emit: (t, p) => (listeners[t] || []).forEach(fn => fn(p)),
        on: (t, fn) => { listeners[t] = listeners[t] || []; listeners[t].push(fn); return () => {}; },
    };
}

describe('Riding — step descriptors', () => {
    it('returns exactly 3 steps', () => {
        const steps = makeRidingSteps({ controller: makeController(), bus: makeBus() });
        expect(steps).toHaveLength(3);
    });

    it('steps are in the correct order', () => {
        const steps = makeRidingSteps({ controller: makeController(), bus: makeBus() });
        expect(steps[0].id).toBe('riding.environment');
        expect(steps[1].id).toBe('riding.maneuver');
        expect(steps[2].id).toBe('riding.productive-time');
    });

    it('every step has stage=riding', () => {
        const steps = makeRidingSteps({ controller: makeController(), bus: makeBus() });
        steps.forEach(s => expect(s.stage).toBe('riding'));
    });
});

describe('Riding — renderCluster smoke', () => {
    it('all clusters render without throwing', () => {
        const doc = makeDOM();
        const raw = makeRidingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        steps.forEach(s => {
            const host = doc.createElement('div');
            expect(() => s.renderCluster(host, s)).not.toThrow();
        });
    });
});

describe('Riding — renderTablet smoke', () => {
    it('all tablets render without throwing', () => {
        const doc = makeDOM();
        const raw = makeRidingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        steps.forEach(s => {
            const host = doc.createElement('div');
            expect(() => s.renderTablet(host, s)).not.toThrow();
        });
    });
});

describe('Riding — environment: Perception HUD', () => {
    it('cluster shows object tracking count', () => {
        const doc = makeDOM();
        const raw = makeRidingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        const env = steps.find(s => s.id === 'riding.environment');
        const host = doc.createElement('div');
        env.renderCluster(host, env);
        expect(host.textContent).toMatch(/object|track|sensor|see/i);
    });

    it('tablet renders perception HUD container', () => {
        const doc = makeDOM();
        const raw = makeRidingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        const env = steps.find(s => s.id === 'riding.environment');
        const host = doc.createElement('div');
        env.renderTablet(host, env);
        // Should have SVG or perception-hud class
        const hasSvg = host.querySelector('svg') !== null;
        const hasClass = host.querySelector('.perception-hud') !== null;
        const hasText = host.textContent.match(/see|perceive|detect|sensor|track/i);
        expect(hasSvg || hasClass || hasText).toBeTruthy();
    });

    it('tablet shows object type legend (VEH / PED / SGN)', () => {
        const doc = makeDOM();
        const raw = makeRidingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        const env = steps.find(s => s.id === 'riding.environment');
        const host = doc.createElement('div');
        env.renderTablet(host, env);
        expect(host.textContent).toMatch(/vehicle|pedestrian|sign/i);
    });
});

describe('Riding — maneuver: preview', () => {
    it('tablet shows an upcoming turn preview', () => {
        const doc = makeDOM();
        const raw = makeRidingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        const maneuver = steps.find(s => s.id === 'riding.maneuver');
        const host = doc.createElement('div');
        maneuver.renderTablet(host, maneuver);
        expect(host.textContent).toMatch(/turn|left|right|brake|upcoming/i);
    });
});

describe('Riding — productive time', () => {
    it('tablet shows productivity tasks', () => {
        const doc = makeDOM();
        const raw = makeRidingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        const prod = steps.find(s => s.id === 'riding.productive-time');
        const host = doc.createElement('div');
        prod.renderTablet(host, prod);
        expect(host.textContent).toMatch(/email|calendar|read|task|time/i);
    });
});
