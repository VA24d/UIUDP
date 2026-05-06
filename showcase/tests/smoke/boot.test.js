// Smoke test — boot environment
// Verifies that the theme system applies a class on :root and that the
// default is 'dark' (cockpit aesthetic). Supports light/dark toggle.

import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme, toggleTheme } from '../../js/core/theme-system.js';

describe('Smoke — applyTheme() defaults', () => {
    beforeEach(() => {
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        localStorage.clear();
    });

    it('applies a theme class to :root (documentElement)', () => {
        applyTheme();
        const classes = Array.from(document.documentElement.classList);
        expect(classes.some(c => c.startsWith('theme-'))).toBe(true);
    });

    it('defaults to dark theme when localStorage is empty', () => {
        applyTheme();
        // Should be dark (cockpit aesthetic is default)
        const hasDark = document.documentElement.classList.contains('theme-dark');
        const hasLight = document.documentElement.classList.contains('theme-light');
        expect(hasDark || hasLight).toBe(true);
        // The default is dark
        expect(hasDark).toBe(true);
    });

    it('respects a saved "light" localStorage preference', () => {
        localStorage.setItem('aerodrive-theme', 'light');
        applyTheme();
        expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    });

    it('respects a saved "dark" localStorage preference', () => {
        localStorage.setItem('aerodrive-theme', 'dark');
        applyTheme();
        expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    });

    it('never applies both theme-light and theme-dark simultaneously', () => {
        applyTheme();
        const cl = document.documentElement.classList;
        expect(cl.contains('theme-light') && cl.contains('theme-dark')).toBe(false);
    });

    it('toggleTheme switches themes', () => {
        // Start fresh with dark
        localStorage.setItem('aerodrive-theme', 'dark');
        applyTheme();
        expect(document.documentElement.classList.contains('theme-dark')).toBe(true);

        // Toggle to light
        const result = toggleTheme();
        expect(result).toBe('light');
        expect(document.documentElement.classList.contains('theme-light')).toBe(true);
        expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    });

    it('toggleTheme persists preference to localStorage', () => {
        localStorage.setItem('aerodrive-theme', 'dark');
        applyTheme();

        toggleTheme(); // dark → light
        expect(localStorage.getItem('aerodrive-theme')).toBe('light');

        toggleTheme(); // light → dark
        expect(localStorage.getItem('aerodrive-theme')).toBe('dark');
    });
});
