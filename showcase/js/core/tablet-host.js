/**
 * Infotainment_Tablet host — mirror of cluster-host. Kept as a separate module
 * so each host can gain surface-specific behavior later (e.g. tablet holds the
 * primary action button, end-of-showcase indicator). Today the two
 * implementations are identical; the shape contract matters more than code
 * dedup and keeps the file tree readable.
 *
 * See design.md "Dashboard_Cluster host and Infotainment_Tablet host".
 */
export function createTabletHost({ root }) {
    if (!root) throw new TypeError('createTabletHost: root is required');
    root.classList.add('is-entered');

    function render(step) {
        root.setAttribute('data-step-id', step.id);
        root.innerHTML = '';
        try {
            step.renderTablet(root, step);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`[tablet-host] render failed for ${step.id}`, err);
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
