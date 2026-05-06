/**
 * Theme_System — applies the light-mode design tokens and exposes reduced-motion
 * detection to the Animation_Controller.
 *
 * See design.md "Theme_System".
 */

const THEME_CLASS = 'theme-light';

export function applyTheme() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.add(THEME_CLASS);
}

/**
 * Detect the `prefers-reduced-motion: reduce` media query and expose a stable
 * reader plus a subscription. The Animation_Controller uses this to short-
 * circuit transitions to an instant swap.
 */
export function createThemeSystem() {
    let reduced = false;
    /** @type {Set<(enabled: boolean) => void>} */
    const listeners = new Set();

    let mql = null;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        try {
            mql = window.matchMedia('(prefers-reduced-motion: reduce)');
            reduced = !!mql.matches;
            const handler = (e) => {
                reduced = !!e.matches;
                for (const fn of listeners) {
                    try { fn(reduced); } catch { /* isolate listener errors */ }
                }
            };
            if (typeof mql.addEventListener === 'function') {
                mql.addEventListener('change', handler);
            } else if (typeof mql.addListener === 'function') {
                // Safari <14 fallback
                mql.addListener(handler);
            }
        } catch { /* jsdom may not fully implement matchMedia */ }
    }

    return {
        isReducedMotion: () => reduced,
        onReducedMotionChange: (fn) => {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        /** Test-only hook: allows tests to force a value. */
        __setReduced: (v) => {
            reduced = !!v;
            for (const fn of listeners) {
                try { fn(reduced); } catch { /* */ }
            }
        },
    };
}
