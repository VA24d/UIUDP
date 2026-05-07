/**
 * Auto-play Module — advances through all steps on a configurable dwell timer.
 *
 * Usage:
 *   const ap = createAutoplay({ bus, controller, steps, dwellMs: 5000 });
 *   ap.toggle(); // start / stop
 *
 * - Press `A` (when focus is not in a text input) to toggle.
 * - Any mouse move or key press (except A-for-autoplay) pauses for 3 s then
 *   resumes automatically.
 * - On last step, auto-play stops (no looping by default).
 * - Renders a small badge + dwell countdown ring in the nav-host area.
 */
export function createAutoplay({ bus, controller, steps, dwellMs = 5000 }) {
    let playing = false;
    let dwellTimer = null;
    let resumeTimer = null;
    let paused = false; // mid-play user-interaction pause
    let elapsed = 0;
    let tickTimer = null;
    const TICK = 250; // ring update resolution
    const RESUME_AFTER_IDLE = 3000;

    // ── Badge element ──────────────────────────────────────────────────────
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'autoplay-badge';
    badge.setAttribute('aria-label', 'Toggle auto-play');
    badge.setAttribute('title', 'Auto-play (A)');
    badge.innerHTML = `<span class="autoplay-dot"></span> AUTO`;

    // ── Internal helpers ───────────────────────────────────────────────────
    function clearTimers() {
        clearTimeout(dwellTimer);
        clearInterval(tickTimer);
        dwellTimer = null;
        tickTimer = null;
    }

    function updateBadge() {
        badge.classList.toggle('is-playing', playing && !paused);
    }

    function scheduleTick() {
        elapsed = 0;
        tickTimer = setInterval(() => {
            elapsed += TICK;
            const pct = Math.min(elapsed / dwellMs, 1);
            bus.emit('autoplayTick', { pct, elapsed, dwellMs });
        }, TICK);
    }

    function scheduleAdvance() {
        clearTimers();
        if (!playing) return;
        scheduleTick();
        dwellTimer = setTimeout(() => {
            const i = controller.getActiveIndex();
            if (i >= steps.length - 1) {
                stop();
                return;
            }
            controller.advance('autoplay');
        }, dwellMs);
    }

    function start() {
        if (playing) return;
        playing = true;
        paused = false;
        updateBadge();
        scheduleAdvance();
        bus.emit('autoplayStart', {});
    }

    function stop() {
        if (!playing) return;
        playing = false;
        paused = false;
        clearTimers();
        clearTimeout(resumeTimer);
        updateBadge();
        bus.emit('autoplayStop', {});
    }

    function pause() {
        if (!playing || paused) return;
        paused = true;
        clearTimers();
        updateBadge();
    }

    function resume() {
        if (!playing || !paused) return;
        paused = false;
        updateBadge();
        scheduleAdvance();
    }

    // ── Interaction-based pause / resume ───────────────────────────────────
    function onUserInteraction() {
        if (!playing) return;
        pause();
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(resume, RESUME_AFTER_IDLE);
    }

    // ── Step change: restart dwell ─────────────────────────────────────────
    bus.on('stepDidChange', () => {
        if (playing && !paused) scheduleAdvance();
    });

    // ── Keyboard `A` toggle ────────────────────────────────────────────────
    function isInTextInput(el) {
        if (!el) return false;
        const t = (el.tagName || '').toLowerCase();
        return t === 'input' || t === 'textarea' || t === 'select' || el.isContentEditable;
    }

    function onKeydown(e) {
        if (isInTextInput(e.target)) return;
        if (e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            toggle();
            return;
        }
        onUserInteraction();
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('mousemove', onUserInteraction, { passive: true });
        window.addEventListener('pointerdown', onUserInteraction, { passive: true });
    }

    badge.addEventListener('click', () => toggle());

    // ── Public API ─────────────────────────────────────────────────────────
    function toggle() {
        if (playing) stop(); else start();
    }

    return {
        toggle,
        start,
        stop,
        isPlaying: () => playing,
        isPaused: () => paused,
        setDwell: (ms) => { dwellMs = ms; },
        getBadge: () => badge,
        destroy: () => {
            stop();
            if (typeof window !== 'undefined') {
                window.removeEventListener('keydown', onKeydown);
                window.removeEventListener('mousemove', onUserInteraction);
                window.removeEventListener('pointerdown', onUserInteraction);
            }
        },
    };
}
