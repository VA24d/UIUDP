// Feature: unified-av-showcase, Property 28: Hash round-trip

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createStateRouter } from '../../js/core/state-router.js';
import { STEPS } from '../../js/steps/registry.js';

describe('Property 28: Hash round-trip', () => {
    const router = createStateRouter({ steps: STEPS });

    it('decode(encode(i)).index === i for every valid step index', () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: STEPS.length - 1 }), i => {
                const hash = router.encode(i);
                const r = router.decode(hash);
                expect(r.ok).toBe(true);
                if (r.ok) expect(r.index).toBe(i);
            }),
            { numRuns: 100 }
        );
    });

    it('encode(decode(s).index) === s when decode(s).ok is true', () => {
        // Arbitrary over valid hashes by encoding random valid indices.
        fc.assert(
            fc.property(fc.integer({ min: 0, max: STEPS.length - 1 }), i => {
                const s = router.encode(i);
                const r = router.decode(s);
                expect(r.ok).toBe(true);
                if (r.ok) expect(router.encode(r.index)).toBe(s);
            }),
            { numRuns: 100 }
        );
    });

    it('decode rejects malformed fragments', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => !/^#\/[a-z-]+\/[a-z0-9-]+$/.test(s)),
                s => {
                    const r = router.decode(s);
                    expect(r.ok).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('decode reports "unknown" for well-formed but non-existent stage/slug', () => {
        const r = router.decode('#/bogus/nope');
        expect(r.ok).toBe(false);
        if (!r.ok) {
            expect(r.reason).toBe('unknown');
            expect(r.fragment).toBe('#/bogus/nope');
        }
    });

    it('encode throws on out-of-range index', () => {
        expect(() => router.encode(-1)).toThrow();
        expect(() => router.encode(STEPS.length)).toThrow();
    });
});
