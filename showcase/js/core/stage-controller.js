/**
 * Stage_Controller — single source of truth for `activeIndex` and the
 * set-based Trust_Moment accounting. All navigation (arrow keys, digit keys,
 * timeline clicks, hash changes, programmatic calls) must flow through
 * `advance`, `retreat`, or `goTo`.
 *
 * See design.md "Stage_Controller".
 */

/**
 * @typedef {Object} StepLike
 * @property {string} id
 * @property {number} globalIndex
 * @property {string} stage
 * @property {string} slug
 * @property {string} label
 * @property {Array<{id: string, text: string}>} trustMoments
 */

/**
 * @param {{
 *   bus: { emit: (t: string, p?: any) => void, on: Function, off?: Function },
 *   steps: StepLike[],
 *   router?: { write?: (i: number) => void }
 * }} deps
 */
export function createStageController({ bus, steps, router }) {
    if (!bus || typeof bus.emit !== 'function') {
        throw new TypeError('createStageController: bus is required');
    }
    if (!Array.isArray(steps) || steps.length === 0) {
        throw new TypeError('createStageController: steps must be non-empty');
    }

    const lastIndex = steps.length - 1;
    let activeIndex = 0;
    /** @type {Set<number>} */
    const countedTrustSteps = new Set();
    let trustCount = 0;

    function clampIndex(i) {
        if (!Number.isFinite(i)) return 0;
        const n = Math.floor(i);
        if (n < 0) return 0;
        if (n > lastIndex) return lastIndex;
        return n;
    }

    /**
     * Accounting helper. Only call when a transition is NOT strictly backward.
     * Adds every index in [0, to] that is not yet counted; trust count can
     * only grow (set-add-only), which makes monotonicity self-evident.
     */
    function countUpTo(to) {
        for (let i = 0; i <= to; i++) {
            if (!countedTrustSteps.has(i)) {
                countedTrustSteps.add(i);
                trustCount += steps[i].trustMoments.length;
            }
        }
    }

    /**
     * @param {number} target
     * @param {{ source?: string }} [opts]
     * @returns {{ changed: boolean, index: number }}
     */
    function setActive(target, opts = {}) {
        const source = opts.source || 'api';
        const clamped = clampIndex(target);
        const fromIndex = activeIndex;
        if (clamped === fromIndex) {
            return { changed: false, index: activeIndex };
        }

        const direction =
            clamped === fromIndex + 1 ? 'forward'
                : clamped === fromIndex - 1 ? 'backward'
                    : clamped > fromIndex ? 'skip'
                        : 'backward';

        bus.emit('stepWillChange', { fromIndex, toIndex: clamped, direction, source });

        // Update Trust_Moment set: forward or forward-skip only.
        if (direction === 'forward' || direction === 'skip') {
            countUpTo(clamped);
        }

        activeIndex = clamped;

        if (router && typeof router.write === 'function') {
            try { router.write(clamped); } catch { /* router errors must never break nav */ }
        }

        bus.emit('stepDidChange', {
            fromIndex,
            toIndex: clamped,
            direction,
            source,
            step: steps[clamped],
            countedTrustCount: trustCount,
        });

        return { changed: true, index: clamped };
    }

    return {
        getActiveIndex: () => activeIndex,
        getTrustCount: () => trustCount,
        getCountedSteps: () => new Set(countedTrustSteps),
        getStep: () => steps[activeIndex],
        advance: (source) => setActive(activeIndex + 1, { source: source || 'advance' }),
        retreat: (source) => setActive(activeIndex - 1, { source: source || 'retreat' }),
        goTo: (i, source) => setActive(i, { source: source || 'goTo' }),
        lastIndex,
    };
}
