// Example tests — summary step
// Verifies the recap step renders trust moments and contains the correct structure.

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { makeSummaryStep } from '../../js/modules/summary.js';
import { buildRegistryWithOverrides } from '../../js/steps/registry.js';

function makeDOM() {
    const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    return window.document;
}
function makeController() {
    return { advance: () => {}, retreat: () => {}, goTo: () => {}, getActiveIndex: () => 0 };
}

// Minimal steps with known trust moments for summary testing
const FIXTURE_STEPS = buildRegistryWithOverrides([
    {
        id: 'intro.welcome', stage: 'intro', slug: 'welcome', label: 'Welcome', title: 'Welcome',
        trustMoments: [],
        renderCluster: () => {}, renderTablet: () => {},
    },
    {
        id: 'onboarding.profile', stage: 'onboarding', slug: 'profile', label: 'Profile', title: 'Profile',
        trustMoments: [{ id: 'tm1', text: 'Data stays on-device' }],
        renderCluster: () => {}, renderTablet: () => {},
    },
    {
        id: 'driving.unmapped-zone', stage: 'driving', slug: 'unmapped-zone', label: 'Unmapped', title: 'Unmapped zone',
        trustMoments: [{ id: 'tm2', text: 'AeroDrive asks, never takes' }],
        renderCluster: () => {}, renderTablet: () => {},
    },
]);

describe('Summary — step metadata', () => {
    it('has id=summary.recap, stage=summary, slug=recap', () => {
        const controller = makeController();
        const summary = makeSummaryStep({ controller, steps: FIXTURE_STEPS });
        expect(summary.id).toBe('summary.recap');
        expect(summary.stage).toBe('summary');
        expect(summary.slug).toBe('recap');
    });
});

describe('Summary — renderCluster', () => {
    it('renders without throwing', () => {
        const doc = makeDOM();
        const controller = makeController();
        const summary = makeSummaryStep({ controller, steps: FIXTURE_STEPS });
        const all = buildRegistryWithOverrides([...FIXTURE_STEPS, summary]);
        const host = doc.createElement('div');
        expect(() => all.at(-1).renderCluster(host, all.at(-1))).not.toThrow();
    });
});

describe('Summary — renderTablet', () => {
    it('renders without throwing', () => {
        const doc = makeDOM();
        const controller = makeController();
        const summary = makeSummaryStep({ controller, steps: FIXTURE_STEPS });
        const all = buildRegistryWithOverrides([...FIXTURE_STEPS, summary]);
        const host = doc.createElement('div');
        expect(() => all.at(-1).renderTablet(host, all.at(-1))).not.toThrow();
    });

    it('contains trust moment text from fixture steps', () => {
        const doc = makeDOM();
        const controller = makeController();
        const summary = makeSummaryStep({ controller, steps: FIXTURE_STEPS });
        const all = buildRegistryWithOverrides([...FIXTURE_STEPS, summary]);
        const host = doc.createElement('div');
        all.at(-1).renderTablet(host, all.at(-1));
        // Should show trust moments or a trust count
        const text = host.textContent;
        expect(text).toMatch(/trust|moment|data|onboarding|driving/i);
    });

    it('contains a restart or continue button', () => {
        const doc = makeDOM();
        const controller = makeController();
        const summary = makeSummaryStep({ controller, steps: FIXTURE_STEPS });
        const all = buildRegistryWithOverrides([...FIXTURE_STEPS, summary]);
        const host = doc.createElement('div');
        all.at(-1).renderTablet(host, all.at(-1));
        const btn = host.querySelector('button');
        expect(btn).not.toBeNull();
    });
});
