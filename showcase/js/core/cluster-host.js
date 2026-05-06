/**
 * Dashboard_Cluster host — thin mount surface that owns the render contract.
 * See design.md "Dashboard_Cluster host and Infotainment_Tablet host".
 *
 * Contract: `render(step)` sets `data-step-id` on the canvas and delegates
 * DOM construction to `step.renderCluster(host, step)`. Exit/enter helpers
 * toggle CSS classes and custom properties so the Animation_Controller can
 * drive a cross-fade that stays in lockstep with the tablet host.
 */
export function createClusterHost({ root }) {
    if (!root) throw new TypeError('createClusterHost: root is required');
    root.classList.add('is-entered');

    function render(step) {
        root.setAttribute('data-step-id', step.id);
        root.innerHTML = '';
        try {
            step.renderCluster(root, step);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`[cluster-host] render failed for ${step.id}`, err);
            root.innerHTML = `<div class="step-stub step-error"><p class="t-caption">${step.stage}</p><h2 class="t-heading">Step failed to render</h2></div>`;
        }
    }

    function beginExit(duration, easing) {
        if (duration != null) root.style.setProperty('--t', `${duration}ms`);
        if (easing) root.style.setProperty('--e', easing);
        root.classList.remove('is-entered');
        root.classList.add('is-exiting');
    }

    function beginEnter(duration, easing) {
        if (duration != null) root.style.setProperty('--t', `${duration}ms`);
        if (easing) root.style.setProperty('--e', easing);
        root.classList.remove('is-exiting');
        root.classList.add('is-entered');
    }

    return {
        root,
        render,
        beginExit,
        beginEnter,
        get currentStepId() { return root.getAttribute('data-step-id'); },
    };
}
