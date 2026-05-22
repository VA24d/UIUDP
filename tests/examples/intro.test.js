// Example tests — intro step
// Verifies that the Intro step renders correctly on both cluster and tablet surfaces.

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { buildRegistryWithOverrides } from '../../js/steps/registry.js';
import { makeIntroStep } from '../../js/modules/intro.js';

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

describe('Intro — renderCluster', () => {
    it('renders the AeroDrive wordmark / brand element', () => {
        const doc = makeDOM();
        const host = doc.createElement('div');
        const controller = makeController();
        const intro = makeIntroStep({ controller });
        const steps = buildRegistryWithOverrides([intro]);
        steps[0].renderCluster(host, steps[0]);
        // Should contain some AeroDrive content
        expect(host.innerHTML.toLowerCase()).toMatch(/aero|drive|autonomous|electric/i);
    });
});

describe('Intro — renderTablet', () => {
    it('renders the intro welcome heading', () => {
        const doc = makeDOM();
        const host = doc.createElement('div');
        const controller = makeController();
        const intro = makeIntroStep({ controller });
        const steps = buildRegistryWithOverrides([intro]);
        steps[0].renderTablet(host, steps[0]);
        // Tablet should have a headline
        const h = host.querySelector('h2') || host.querySelector('h1') || host.querySelector('[class*="title"]');
        expect(h).not.toBeNull();
    });

    it('calls controller.advance when the CTA is clicked', () => {
        const doc = makeDOM();
        const host = doc.createElement('div');
        let advanced = false;
        const controller = { ...makeController(), advance: () => { advanced = true; } };
        const intro = makeIntroStep({ controller });
        const steps = buildRegistryWithOverrides([intro]);
        steps[0].renderTablet(host, steps[0]);
        const cta = host.querySelector('[data-cta]') || host.querySelector('button');
        cta?.click();
        expect(advanced).toBe(true);
    });
});

describe('Intro — step metadata', () => {
    it('has stage=intro, slug=welcome, id=intro.welcome', () => {
        const controller = makeController();
        const intro = makeIntroStep({ controller });
        expect(intro.id).toBe('intro.welcome');
        expect(intro.stage).toBe('intro');
        expect(intro.slug).toBe('welcome');
    });

    it('has an array trustMoments', () => {
        const controller = makeController();
        const intro = makeIntroStep({ controller });
        expect(Array.isArray(intro.trustMoments)).toBe(true);
    });
});
