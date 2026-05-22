// Example tests — onboarding steps
// Verifies each of the 6 onboarding steps has the required fields and renders without throwing.

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { makeOnboardingSteps } from '../../js/modules/onboarding.js';
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

const EXPECTED_IDS = [
    'onboarding.profile',
    'onboarding.comfort',
    'onboarding.locations',
    'onboarding.drive-explained',
    'onboarding.takeover-drill',
    'onboarding.preferences',
];

describe('Onboarding — step descriptors', () => {
    it('returns exactly 6 steps in the correct order', () => {
        const controller = makeController();
        const bus = makeBus();
        const steps = makeOnboardingSteps({ controller, bus });
        expect(steps).toHaveLength(6);
        steps.forEach((s, i) => {
            expect(s.id).toBe(EXPECTED_IDS[i]);
        });
    });

    it('every step has stage=onboarding', () => {
        const controller = makeController();
        const bus = makeBus();
        const steps = makeOnboardingSteps({ controller, bus });
        steps.forEach(s => expect(s.stage).toBe('onboarding'));
    });

    it('every step has at least one trustMoment', () => {
        const controller = makeController();
        const bus = makeBus();
        const steps = makeOnboardingSteps({ controller, bus });
        steps.forEach(s => {
            expect(Array.isArray(s.trustMoments)).toBe(true);
            expect(s.trustMoments.length).toBeGreaterThanOrEqual(1);
        });
    });
});

describe('Onboarding — renderCluster smoke', () => {
    it('every step renderCluster does not throw', () => {
        const doc = makeDOM();
        const controller = makeController();
        const bus = makeBus();
        const steps = makeOnboardingSteps({ controller, bus });
        const allSteps = buildRegistryWithOverrides(steps);
        allSteps.forEach(s => {
            const host = doc.createElement('div');
            expect(() => s.renderCluster(host, s)).not.toThrow();
            expect(host.innerHTML.length).toBeGreaterThan(0);
        });
    });
});

describe('Onboarding — renderTablet smoke', () => {
    it('every step renderTablet does not throw', () => {
        const doc = makeDOM();
        const controller = makeController();
        const bus = makeBus();
        const steps = makeOnboardingSteps({ controller, bus });
        const allSteps = buildRegistryWithOverrides(steps);
        allSteps.forEach(s => {
            const host = doc.createElement('div');
            expect(() => s.renderTablet(host, s)).not.toThrow();
            expect(host.innerHTML.length).toBeGreaterThan(0);
        });
    });
});

describe('Onboarding — profile step', () => {
    it('renderTablet produces a heading with "Profile" or "Identity"', () => {
        const doc = makeDOM();
        const controller = makeController();
        const bus = makeBus();
        const raw = makeOnboardingSteps({ controller, bus });
        const steps = buildRegistryWithOverrides(raw);
        const profile = steps.find(s => s.id === 'onboarding.profile');
        const host = doc.createElement('div');
        profile.renderTablet(host, profile);
        expect(host.textContent).toMatch(/profile|identity|name|face/i);
    });
});

describe('Onboarding — takeover-drill step', () => {
    it('renderTablet contains a countdown or drill CTA', () => {
        const doc = makeDOM();
        const controller = makeController();
        const bus = makeBus();
        const raw = makeOnboardingSteps({ controller, bus });
        const steps = buildRegistryWithOverrides(raw);
        const drill = steps.find(s => s.id === 'onboarding.takeover-drill');
        const host = doc.createElement('div');
        drill.renderTablet(host, drill);
        expect(host.textContent).toMatch(/drill|grip|take.?over|practice|hand.?over/i);
    });
});
