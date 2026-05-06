// Feature: unified-av-showcase, Property 12: Contrast ratio compliance

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TOKENS, CONTRAST_PAIRS } from '../fixtures/contrast-manifest.js';

/** Parse #RRGGBB hex into 0–255 triplet. */
function hex(c) {
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c);
    if (!m) throw new Error(`invalid hex: ${c}`);
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/** WCAG 2.1 relative luminance. */
function relLum(rgb) {
    const [r, g, b] = rgb.map(v => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
    const la = relLum(hex(TOKENS[a]));
    const lb = relLum(hex(TOKENS[b]));
    const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
}

describe('Property 12: Contrast ratio compliance', () => {
    it('every body pair clears 4.5:1; every large pair clears 3.0:1', () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: CONTRAST_PAIRS.length - 1 }), (i) => {
                const pair = CONTRAST_PAIRS[i];
                const ratio = contrast(pair.fg, pair.bg);
                const bar = pair.kind === 'body' ? 4.5 : 3.0;
                expect(ratio, `${pair.role} (${pair.fg} on ${pair.bg}) = ${ratio.toFixed(2)}:1 < ${bar}`)
                    .toBeGreaterThanOrEqual(bar);
            }),
            { numRuns: Math.max(100, CONTRAST_PAIRS.length * 3) }
        );
    });

    it('manifest-declared tokens all parse as valid hex', () => {
        for (const [name, value] of Object.entries(TOKENS)) {
            expect(() => hex(value), `invalid hex for ${name}: ${value}`).not.toThrow();
        }
    });
});
