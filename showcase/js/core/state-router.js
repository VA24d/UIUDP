/**
 * State_Router — maps `activeIndex` to URL hash and back.
 *
 * Hash grammar: `#/<stage>/<slug>` where stage ∈ the canonical stage set and
 * slug matches `[a-z0-9-]+`. See design.md "State_Router".
 */

/**
 * @typedef {{ ok: true, index: number }} DecodeOk
 * @typedef {{ ok: false, reason: 'malformed'|'unknown', fragment: string }} DecodeErr
 */

const HASH_RE = /^#\/([a-z-]+)\/([a-z0-9-]+)$/;

/**
 * @param {{ steps: Array<{stage: string, slug: string}>, onIndexFromHash?: (r: DecodeOk|DecodeErr) => void }} deps
 */
export function createStateRouter({ steps, onIndexFromHash }) {
    if (!Array.isArray(steps) || steps.length === 0) {
        throw new Error('createStateRouter: steps must be a non-empty array');
    }

    /** @param {number} index */
    function encode(index) {
        const i = Number.isInteger(index) ? index : -1;
        if (i < 0 || i >= steps.length) {
            throw new RangeError(`state-router.encode: index out of range ${index}`);
        }
        const s = steps[i];
        return `#/${s.stage}/${s.slug}`;
    }

    /**
     * @param {string} hash
     * @returns {DecodeOk|DecodeErr}
     */
    function decode(hash) {
        const raw = typeof hash === 'string' ? hash : '';
        const m = HASH_RE.exec(raw);
        if (!m) return { ok: false, reason: 'malformed', fragment: raw };
        const [, stage, slug] = m;
        const idx = steps.findIndex(s => s.stage === stage && s.slug === slug);
        if (idx < 0) return { ok: false, reason: 'unknown', fragment: raw };
        return { ok: true, index: idx };
    }

    /** @param {number} index */
    function write(index) {
        const next = encode(index);
        if (typeof window === 'undefined' || !window.location) return;
        if (window.location.hash !== next) {
            try {
                window.history.replaceState(null, '', next);
            } catch {
                // Some test harnesses block history manipulation; fall back.
                window.location.hash = next;
            }
        }
    }

    let unsubscribeHash = () => { };
    if (typeof window !== 'undefined' && typeof onIndexFromHash === 'function') {
        const handler = () => onIndexFromHash(decode(window.location.hash));
        window.addEventListener('hashchange', handler);
        unsubscribeHash = () => window.removeEventListener('hashchange', handler);
    }

    return { encode, decode, write, destroy: () => unsubscribeHash() };
}
