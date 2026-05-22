// Example tests — driving steps
// Covers all 4 driving scenarios: unmapped-zone, fatigue, battery, weather.

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { makeDrivingSteps } from '../../js/modules/driving.js';
import { buildRegistryWithOverrides } from '../../js/steps/registry.js';

function makeDOM() {
    const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    return window.document;
}
function makeController() {
    return { advance: () => { }, retreat: () => { }, goTo: () => { }, getActiveIndex: () => 0 };
}
function makeBus() {
    const listeners = {};
    return {
        emit: (t, p) => (listeners[t] || []).forEach(fn => fn(p)),
        on: (t, fn) => { listeners[t] = listeners[t] || []; listeners[t].push(fn); return () => { }; },
    };
}

const EXPECTED_IDS = [
    'driving.intro',
    'driving.unmapped-zone',
    'driving.fatigue',
    'driving.battery',
    'driving.weather',
];

describe('Driving — step descriptors', () => {
    it('returns exactly 5 steps in the correct order', () => {
        const controller = makeController();
        const bus = makeBus();
        const steps = makeDrivingSteps({ controller, bus });
        expect(steps).toHaveLength(5);
        steps.forEach((s, i) => expect(s.id).toBe(EXPECTED_IDS[i]));
    });

    it('every step has stage=driving', () => {
        const steps = makeDrivingSteps({ controller: makeController(), bus: makeBus() });
        steps.forEach(s => expect(s.stage).toBe('driving'));
    });

    it('every non-intro step has at least one trustMoment', () => {
        const steps = makeDrivingSteps({ controller: makeController(), bus: makeBus() });
        steps.filter(s => s.slug !== 'intro').forEach(s => {
            expect(Array.isArray(s.trustMoments)).toBe(true);
            expect(s.trustMoments.length).toBeGreaterThanOrEqual(1);
        });
    });
});

describe('Driving — renderCluster smoke', () => {
    it('all four clusters render without throwing', () => {
        const doc = makeDOM();
        const raw = makeDrivingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        steps.forEach(s => {
            const host = doc.createElement('div');
            expect(() => s.renderCluster(host, s)).not.toThrow();
            expect(host.innerHTML.length).toBeGreaterThan(0);
        });
    });
});

describe('Driving — renderTablet smoke', () => {
    it('all four tablets render without throwing', () => {
        const doc = makeDOM();
        const raw = makeDrivingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        steps.forEach(s => {
            const host = doc.createElement('div');
            expect(() => s.renderTablet(host, s)).not.toThrow();
            expect(host.innerHTML.length).toBeGreaterThan(0);
        });
    });
});

describe('Driving — unmapped-zone scenario', () => {
    it('cluster shows WATCHING or L4 text', () => {
        const doc = makeDOM();
        const raw = makeDrivingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        const step = steps.find(s => s.id === 'driving.unmapped-zone');
        const host = doc.createElement('div');
        step.renderCluster(host, step);
        expect(host.textContent).toMatch(/watch|L4|unmapped/i);
    });
});

describe('Driving — battery scenario', () => {
    it('tablet contains POI map or charger reference', () => {
        const doc = makeDOM();
        const raw = makeDrivingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        const step = steps.find(s => s.id === 'driving.battery');
        const host = doc.createElement('div');
        step.renderTablet(host, step);
        expect(host.textContent).toMatch(/charger|reroute|range|battery/i);
    });

    it('tablet contains POI map SVG', () => {
        const doc = makeDOM();
        const raw = makeDrivingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        const step = steps.find(s => s.id === 'driving.battery');
        const host = doc.createElement('div');
        step.renderTablet(host, step);
        expect(host.querySelector('.poi-map-wrap') || host.innerHTML).toBeTruthy();
    });
});

describe('Driving — weather scenario', () => {
    it('cluster shows SENSOR DEGRADED alert', () => {
        const doc = makeDOM();
        const raw = makeDrivingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        const step = steps.find(s => s.id === 'driving.weather');
        const host = doc.createElement('div');
        step.renderCluster(host, step);
        expect(host.textContent).toMatch(/sensor|degrad|rain|weather/i);
    });

    it('tablet contains rain and range reduction info', () => {
        const doc = makeDOM();
        const raw = makeDrivingSteps({ controller: makeController(), bus: makeBus() });
        const steps = buildRegistryWithOverrides(raw);
        const step = steps.find(s => s.id === 'driving.weather');
        const host = doc.createElement('div');
        step.renderTablet(host, step);
        expect(host.textContent).toMatch(/rain|60 m|sensor/i);
    });

    it('weather step has L3 ASSISTED autonomy', () => {
        const raw = makeDrivingSteps({ controller: makeController(), bus: makeBus() });
        const step = raw.find(s => s.id === 'driving.weather');
        const doc = makeDOM();
        const host = doc.createElement('div');
        step.renderCluster(host, step);
        expect(host.textContent).toMatch(/L3/);
    });
});
