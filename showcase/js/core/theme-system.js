/**
 * Theme_System — applies design tokens (dark default) and exposes reduced-motion
 * detection to the Animation_Controller. Supports light/dark toggle.
 *
 * See design.md "Theme_System".
 */

const STORAGE_KEY = 'aerodrive-theme';

export function applyTheme() {
    if (typeof document === 'undefined') return;
    // Default to 'dark' (cockpit aesthetic); respect saved preference.
    let saved = 'dark';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'dark'; } catch { /* */ }
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${saved}`);
    // Sync toggle button icon if already in DOM
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) icon.className = saved === 'dark' ? 'ph-fill ph-sun' : 'ph-fill ph-moon';
    }
}

/**
 * Toggle between light and dark theme. Returns the new theme name.
 * @returns {'light'|'dark'}
 */
export function toggleTheme() {
    if (typeof document === 'undefined') return 'dark';
    const root = document.documentElement;
    const isCurrentlyDark = root.classList.contains('theme-dark');
    const newTheme = isCurrentlyDark ? 'light' : 'dark';
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${newTheme}`);
    try { localStorage.setItem(STORAGE_KEY, newTheme); } catch { /* */ }

    // Update toggle button icon if it exists
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = newTheme === 'dark' ? 'ph-fill ph-sun' : 'ph-fill ph-moon';
        }
    }

    return newTheme;
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
