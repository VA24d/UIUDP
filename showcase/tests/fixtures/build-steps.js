/**
 * Test helper: builds the full STEPS registry with real stage-module overrides.
 * Used by rendering / scenarios / voice / summary property tests.
 */
import { buildRegistryWithOverrides } from '../../js/steps/registry.js';
import { makeIntroStep } from '../../js/modules/intro.js';
import { makeOnboardingSteps } from '../../js/modules/onboarding.js';
import { makeDrivingSteps } from '../../js/modules/driving.js';
import { makeRidingSteps } from '../../js/modules/riding.js';
import { makeSummaryStep } from '../../js/modules/summary.js';
import { createBus } from '../../js/core/event-bus.js';
import { createStageController } from '../../js/core/stage-controller.js';

/**
 * Build a fresh bus / controller / STEPS triple where the STEPS registry is
 * populated with the real stage-module renderers. Tests can pass this into
 * hosts and assert on the rendered DOM.
 */
export function buildFullStepsHarness() {
    const bus = createBus();
    // Temporary controller that the stage modules will capture. We swap the
    // captured reference onto the real controller after we build STEPS so
    // render-fn click handlers go through the same controller as the bus
    // events.
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

    // Build a pseudo-registry just to pass to the summary so it can read
    // trust moments from other modules.
    const preSummaryOverrides = [intro, ...onboarding, ...driving, ...riding];
    const preRegistry = buildRegistryWithOverrides(preSummaryOverrides);
    const summary = makeSummaryStep({ controller: controllerRef, steps: preRegistry });

    const steps = buildRegistryWithOverrides([intro, ...onboarding, ...driving, ...riding, summary]);
    const controller = createStageController({ bus, steps });
    holder.controller = controller;
    return { bus, steps, controller };
}
