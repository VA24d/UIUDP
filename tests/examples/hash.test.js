// Example tests — hash-based deep linking
// Verifies the state-router can encode and decode all valid step hashes.

import { describe, it, expect } from 'vitest';
import { createStateRouter } from '../../js/core/state-router.js';
import { STEPS } from '../../js/steps/registry.js';

function makeRouter() {
    return createStateRouter({ steps: STEPS, onIndexFromHash: () => {} });
}

describe('Hash routing — encode / decode round-trip', () => {
    it('every step can be encoded and decoded back to the same index', () => {
        const router = makeRouter();
        STEPS.forEach((step, i) => {
            const hash = router.encode(i);
            const decoded = router.decode(hash);
            expect(decoded.ok).toBe(true);
            expect(decoded.index).toBe(i);
        });
    });

    it('encode produces a non-empty string starting with #/', () => {
        const router = makeRouter();
        STEPS.forEach((_, i) => {
            const hash = router.encode(i);
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(1);
            expect(hash.startsWith('#/')).toBe(true);
        });
    });
});

describe('Hash routing — unknown / malformed fragments', () => {
    it('unknown slug returns ok=false', () => {
        const router = makeRouter();
        const result = router.decode('#/driving/nonexistent');
        expect(result.ok).toBe(false);
    });

    it('empty hash returns ok=false', () => {
        const router = makeRouter();
        const result = router.decode('');
        expect(result.ok).toBe(false);
    });

    it('garbled hash returns ok=false and preserves the fragment', () => {
        const router = makeRouter();
        const result = router.decode('#/???');
        expect(result.ok).toBe(false);
        expect(result.fragment).toBeDefined();
    });
});

describe('Hash routing — driving.weather step', () => {
    it('driving.weather is reachable by its canonical hash', () => {
        const router = makeRouter();
        const idx = STEPS.findIndex(s => s.id === 'driving.weather');
        expect(idx).toBeGreaterThan(-1);
        const hash = router.encode(idx);
        const decoded = router.decode(hash);
        expect(decoded.ok).toBe(true);
        expect(decoded.index).toBe(idx);
    });
});
