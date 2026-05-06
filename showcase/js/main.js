/**
 * Unified AV Showcase — boot entry.
 * Wires every module per the deterministic boot order in design.md task 22.
 */
import { applyTheme, createThemeSystem } from './core/theme-system.js';
import { createBus } from './core/event-bus.js';
import { buildRegistryWithOverrides, STAGES } from './steps/registry.js';
import { createStateRouter } from './core/state-router.js';
import { createStageController } from './core/stage-controller.js';
import { createAnimationController } from './core/animation-controller.js';
import { createClusterHost } from './core/cluster-host.js';
import { createTabletHost } from './core/tablet-host.js';
import { createTimeline } from './core/timeline.js';
import { createNavControls } from './core/nav-controls.js';
import { showHashErrorToast } from './core/toast.js';
import { createHUD } from './core/hud.js';
import { createVoiceService } from './core/voice.js';

import { makeIntroStep } from './modules/intro.js';
import { makeOnboardingSteps } from './modules/onboarding.js';
import { makeDrivingSteps } from './modules/driving.js';
import { makeRidingSteps } from './modules/riding.js';
import { makeSummaryStep } from './modules/summary.js';

function boot() {
    // 1. Theme.
    applyTheme();
    const theme = createThemeSystem();

    // 2. Event bus.
    const bus = createBus();

    // 3. Build STEPS with controller proxy so renderers can call goTo/advance.
    const holder = {};
    const controllerRef = new Proxy({}, {
        get(_t, prop) {
            if (!holder.controller) return () => { };
            return holder.controller[prop];
        },
    });

    const intro = makeIntroStep({ controller: controllerRef });
    const onboarding = makeOnboardingSteps({ controller: controllerRef, bus });
    const driving = makeDrivingSteps({ controller: controllerRef, bus });
    const riding = makeRidingSteps({ controller: controllerRef, bus });

    // Pre-build registry so the summary can read trust moments from the others.
    const preReg = buildRegistryWithOverrides([intro, ...onboarding, ...driving, ...riding]);
    const summary = makeSummaryStep({ controller: controllerRef, steps: preReg });

    const steps = buildRegistryWithOverrides([intro, ...onboarding, ...driving, ...riding, summary]);

    // 4. Hosts.
    const clusterRoot = document.querySelector('.cluster');
    const tabletRoot = document.querySelector('.tablet');
    const timelineRoot = document.querySelector('.timeline');
    const toastHost = document.querySelector('.toast-host');
    const navHostRoot = document.querySelector('.nav-host');
    const srStatus = document.querySelector('[role="status"].sr-only') || document.querySelector('.sr-only[role="status"]');
    const clusterHost = createClusterHost({ root: clusterRoot });
    const tabletHost = createTabletHost({ root: tabletRoot });

    // 5. Router — bound to the controller after it is created below.
    let onIndexFromHash = () => { };
    const router = createStateRouter({
        steps,
        onIndexFromHash: (r) => onIndexFromHash(r),
    });

    // 6. Controller.
    const controller = createStageController({ bus, steps, router });
    holder.controller = controller;

    // 7. Animation controller — subscribes to bus itself.
    createAnimationController({ bus, clusterHost, tabletHost, themeSystem: theme });

    // 8. Timeline.
    createTimeline({ bus, steps, controller, host: timelineRoot });

    // 9. Nav + global keyboard bindings. Nav goes into its own grid row so it
    // never overlaps step content inside the tablet.
    const nav = createNavControls({ bus, steps, controller, tabletRoot: navHostRoot });

    // 9b. HUD — subscribes to stepDidChange via bus internally.
    createHUD({ bus });

    // 9c. Voice service — always-on, auto-starts recognition on boot.
    // Connects to controller for advance/retreat, subscribes to step changes
    // for context-aware command routing and suppression during driving stages.
    createVoiceService({ bus, controller, steps });

    // 10. Router → controller bridge. On malformed or unknown hash, reset and toast.
    onIndexFromHash = (r) => {
        if (r.ok) controller.goTo(r.index, 'hashchange');
        else {
            showHashErrorToast({
                host: toastHost,
                fragment: r.fragment,
                onDismiss: () => { /* no-op; hash already rewritten by controller */ },
            });
            controller.goTo(0, 'hashchange-bad');
        }
    };

    // 11. Announce step changes to screen readers.
    if (srStatus) {
        bus.on('stepDidChange', ({ step, toIndex }) => {
            srStatus.textContent = `${step.stage}, step ${toIndex + 1} of ${steps.length}: ${step.label}`;
        });
    }

    // 12. Initial render — decode hash once, default to 0 if missing/invalid.
    const initial = router.decode(window.location.hash);
    if (initial.ok) {
        // Force a state change so hosts render. goTo(0) when activeIndex === 0 is
        // a no-op; prime the hosts first.
        clusterHost.render(steps[0]);
        tabletHost.render(steps[0]);
        nav.sync();
        if (initial.index !== 0) controller.goTo(initial.index, 'boot');
    } else if (window.location.hash && window.location.hash.length > 1) {
        // Malformed or unknown deep link.
        clusterHost.render(steps[0]);
        tabletHost.render(steps[0]);
        nav.sync();
        showHashErrorToast({ host: toastHost, fragment: window.location.hash });
    } else {
        // Fresh boot, no hash.
        clusterHost.render(steps[0]);
        tabletHost.render(steps[0]);
        nav.sync();
    }

    // eslint-disable-next-line no-console
    console.log('[showcase] booted', { steps: steps.length, stages: STAGES });
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}

export { boot };
