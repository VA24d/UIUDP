/**
 * Contrast manifest — every (fg, bg) token pair used by the design, each
 * tagged 'body' (must clear 4.5:1) or 'large' (must clear 3.0:1) per
 * Req 6.3 / 6.4. Used by tests/properties/contrast.test.js.
 * Values mirror showcase/css/tokens.css.
 */

export const TOKENS = {
    'surface-page': '#F6F5F2',
    'surface-elevated': '#FFFFFF',
    'surface-subtle': '#ECEBE7',
    'text-primary': '#0F172A',
    'text-secondary': '#475569',
    'text-on-accent': '#FFFFFF',
    'accent-primary': '#2B4CFF',
    'accent-soft': '#EEF2FF',
    'success': '#1F7A4C',
    'warning': '#B45309',
    'critical': '#B91C1C',
};

export const CONTRAST_PAIRS = [
    { fg: 'text-primary', bg: 'surface-page', kind: 'body', role: 'body text on page' },
    { fg: 'text-primary', bg: 'surface-elevated', kind: 'body', role: 'body text on elevated surface' },
    { fg: 'text-primary', bg: 'surface-subtle', kind: 'body', role: 'body text on subtle panel' },
    { fg: 'text-secondary', bg: 'surface-page', kind: 'body', role: 'caption / secondary text on page' },
    { fg: 'text-secondary', bg: 'surface-elevated', kind: 'body', role: 'caption / secondary text on elevated' },
    { fg: 'text-on-accent', bg: 'accent-primary', kind: 'body', role: 'CTA label on accent' },
    { fg: 'text-on-accent', bg: 'success', kind: 'body', role: 'success pill label' },
    { fg: 'success', bg: 'surface-page', kind: 'body', role: 'success status text on page' },
    { fg: 'warning', bg: 'surface-page', kind: 'body', role: 'warning status text on page' },
    { fg: 'critical', bg: 'surface-page', kind: 'body', role: 'critical status text on page' },
    { fg: 'accent-primary', bg: 'surface-page', kind: 'body', role: 'accent link text on page' },
    { fg: 'accent-primary', bg: 'accent-soft', kind: 'body', role: 'accent on soft accent wash' },

    { fg: 'text-primary', bg: 'accent-soft', kind: 'large', role: 'large display text on soft accent' },
];
