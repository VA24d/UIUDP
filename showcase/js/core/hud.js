/**
 * HUD Management Module.
 * Provides contextual labels, progress, alerts, and cockpit annotations
 * that update as the user navigates through the showcase steps.
 *
 * Factory: createHUD({ bus }) → { updateHudContext, showHudAlert, updateAnnotation }
 */

const hudContextMap = {
    'intro.welcome': { label: 'WELCOME', progress: 0, warning: false },
    'onboarding.profile': { label: 'PROFILE: SETTING UP', progress: 16, warning: false },
    'onboarding.comfort': { label: 'CABIN: CALIBRATING', progress: 33, warning: false },
    'onboarding.locations': { label: 'NAV: CONFIGURING', progress: 50, warning: false },
    'onboarding.drive-explained': { label: 'LEARNING: REVIEW', progress: 66, warning: false },
    'onboarding.takeover-drill': { label: '⚠ TAKE-OVER DRILL', progress: 83, warning: true },
    'onboarding.preferences': { label: 'TUNING: PREFERENCES', progress: 95, warning: false },
    'driving.unmapped-zone': { label: 'DRIVING: UNMAPPED ZONE', progress: 100, warning: true },
    'driving.fatigue': { label: 'DRIVING: FATIGUE WATCH', progress: 100, warning: true },
    'driving.battery': { label: 'DRIVING: BATTERY', progress: 100, warning: true },
    'riding.environment': { label: 'RIDING: ENVIRONMENT', progress: 100, warning: false },
    'riding.maneuver': { label: 'RIDING: MANEUVER', progress: 100, warning: false },
    'riding.productive-time': { label: 'RIDING: PRODUCTIVE', progress: 100, warning: false },
    'summary.recap': { label: '✓ SHOWCASE COMPLETE', progress: 100, warning: false },
};

/**
 * Create the HUD management service.
 * @param {{ bus: { on: Function, emit: Function } }} deps
 */
export function createHUD({ bus }) {
    // Element references
    const contextLabel = document.getElementById('hud-context-label');
    const progressFill = document.getElementById('hud-progress-fill');
    const hudPanel = document.getElementById('hud-panel');
    const alertEl = document.getElementById('hud-alert');
    const alertText = document.getElementById('hud-alert-text');
    const annotationEl = document.getElementById('cockpit-annotation');

    let alertTimer = null;
    let annotationTimer = null;
    const defaultAnnotation = 'AeroDrive Onboarding Active';

    /**
     * Update HUD context display for the given step.
     * Sets the label text, progress bar width, and warning state.
     * @param {object} step - Step descriptor with an `id` property
     */
    function updateHudContext(step) {
        const ctx = hudContextMap[step.id];
        if (!ctx) return;

        if (contextLabel) {
            contextLabel.textContent = ctx.label;
        }
        if (progressFill) {
            progressFill.style.width = `${ctx.progress}%`;
        }
        if (hudPanel) {
            if (ctx.warning) {
                hudPanel.classList.add('hud-warning');
            } else {
                hudPanel.classList.remove('hud-warning');
            }
        }
    }

    /**
     * Show a temporary color-coded alert in the HUD.
     * Auto-dismisses after 2.5 seconds.
     * @param {string} msg - Alert message text
     * @param {string} [color] - CSS color value for the alert accent
     */
    function showHudAlert(msg, color) {
        if (!alertEl || !alertText) return;

        // Clear any existing timer
        if (alertTimer) {
            clearTimeout(alertTimer);
            alertTimer = null;
        }

        alertText.textContent = msg;
        if (color) {
            alertEl.style.setProperty('--hud-alert-color', color);
        } else {
            alertEl.style.removeProperty('--hud-alert-color');
        }

        alertEl.classList.remove('hidden');

        alertTimer = setTimeout(() => {
            alertEl.classList.add('hidden');
            alertTimer = null;
        }, 2500);
    }

    /**
     * Update the cockpit annotation text.
     * If isAction is true, the message auto-reverts to the default after 3 seconds.
     * @param {string} text - Annotation text
     * @param {boolean} [isAction=false] - Whether this is a temporary action message
     */
    function updateAnnotation(text, isAction = false) {
        if (!annotationEl) return;

        // Clear any pending revert timer
        if (annotationTimer) {
            clearTimeout(annotationTimer);
            annotationTimer = null;
        }

        annotationEl.textContent = text;

        if (isAction) {
            annotationEl.classList.add('annotation-action');
            annotationTimer = setTimeout(() => {
                annotationEl.textContent = defaultAnnotation;
                annotationEl.classList.remove('annotation-action');
                annotationTimer = null;
            }, 3000);
        } else {
            annotationEl.classList.remove('annotation-action');
        }
    }

    // Subscribe to step changes via bus
    bus.on('stepDidChange', ({ step }) => {
        updateHudContext(step);
    });

    return {
        updateHudContext,
        showHudAlert,
        updateAnnotation,
    };
}
