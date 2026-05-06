/**
 * Animation_Controller — orchestrates Stage-to-Stage and Step-to-Step transitions
 * across the Dashboard_Cluster and Infotainment_Tablet in lockstep.
 *
 * See design.md "Animation_Controller".
 *
 * Contract:
 *   - Subscribes to `stepDidChange` on the bus.
 *   - Cancels any in-flight transition before starting a new one.
 *   - 400ms for adjacent steps, 600ms for skip transitions.
 *   - Forward/skip → `--motion-ease-forward`; backward → `--motion-ease-backward`.
 *   - Schedules beginExit + beginEnter so both hosts render in the same rAF tick.
 *   - Emits `transitionComplete` after `duration + 20` ms (guard).
 *   - Reduced-motion: renders synchronously and emits `transitionComplete` in the
 *     same tick.
 *   - On error: renders synchronously, emits `transitionFailed` then `transitionComplete`.
 */
export function createAnimationController({ bus, clusterHost, tabletHost, themeSystem }) {
    if (!bus || typeof bus.on !== 'function') throw new TypeError('bus required');
    if (!clusterHost || !tabletHost) throw new TypeError('hosts required');

    let current = null; // { cancel: fn, toIndex }
    let crossFadeCount = 0; // test-observable — number of crossFade invocations this session

    function isReducedMotion() {
        if (themeSystem && typeof themeSystem.isReducedMotion === 'function') {
            return themeSystem.isReducedMotion();
        }
        return false;
    }

    function rafOrNow(fn) {
        if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(fn);
        // jsdom without rAF: fall back to microtask-ish next tick.
        return setTimeout(() => fn(Date.now()), 0);
    }

    function cafOrNoop(id) {
        if (typeof cancelAnimationFrame === 'function') {
            try { cancelAnimationFrame(id); return; } catch { /* */ }
        }
        try { clearTimeout(id); } catch { /* */ }
    }

    /**
     * @param {{ step: any, fromIndex: number, toIndex: number, duration: number, easing: string }} ctx
     */
    function crossFade(ctx) {
        crossFadeCount += 1;
        const { step, duration, easing } = ctx;
        let raf1 = 0;
        let raf2 = 0;
        let timer = null;
        let cancelled = false;

        const cancel = () => {
            if (cancelled) return;
            cancelled = true;
            if (raf1) cafOrNoop(raf1);
            if (raf2) cafOrNoop(raf2);
            if (timer) clearTimeout(timer);
        };

        try {
            clusterHost.beginExit(duration, easing);
            tabletHost.beginExit(duration, easing);
            raf1 = rafOrNow(() => {
                if (cancelled) return;
                raf2 = rafOrNow(() => {
                    if (cancelled) return;
                    clusterHost.render(step);
                    tabletHost.render(step);
                    clusterHost.beginEnter(duration, easing);
                    tabletHost.beginEnter(duration, easing);
                    timer = setTimeout(() => {
                        if (cancelled) return;
                        bus.emit('transitionComplete', { index: ctx.toIndex });
                        if (current && current.toIndex === ctx.toIndex) current = null;
                    }, duration + 20);
                });
            });
        } catch (err) {
            onFail(step, ctx.toIndex, err);
        }

        return { cancel, toIndex: ctx.toIndex };
    }

    function onFail(step, toIndex, err) {
        // eslint-disable-next-line no-console
        console.error('[animation] crossFade failed', err);
        try {
            clusterHost.render(step);
            tabletHost.render(step);
        } catch { /* last-resort */ }
        bus.emit('transitionFailed', { index: toIndex, reason: 'animation-error' });
        bus.emit('transitionComplete', { index: toIndex });
        if (current && current.toIndex === toIndex) current = null;
    }

    bus.on('stepDidChange', (payload) => {
        const { step, toIndex, fromIndex, direction } = payload;
        if (current) {
            try { current.cancel(); } catch { /* */ }
            current = null;
        }

        if (isReducedMotion()) {
            // Req 7.6 — instantaneous swap.
            try {
                clusterHost.render(step);
                tabletHost.render(step);
            } catch (err) {
                onFail(step, toIndex, err);
                return;
            }
            bus.emit('transitionComplete', { index: toIndex });
            return;
        }

        const distance = Math.abs(toIndex - fromIndex);
        const duration = distance > 1 ? 600 : 400; // Req 7.2, 7.4
        const easing =
            direction === 'backward'
                ? 'var(--motion-ease-backward)'
                : 'var(--motion-ease-forward)';

        current = crossFade({ step, fromIndex, toIndex, duration, easing });
    });

    return {
        __getCrossFadeCount: () => crossFadeCount,
        __resetCrossFadeCount: () => { crossFadeCount = 0; },
        cancelInFlight: () => {
            if (current) {
                try { current.cancel(); } catch { /* */ }
                current = null;
            }
        },
    };
}
