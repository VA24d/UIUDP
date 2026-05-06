/**
 * Nav controls + global keyboard bindings.
 *
 * - Renders a `.nav` region (advance + retreat buttons) into the Infotainment
 *   Tablet surface on every step.
 * - First step hides the retreat button (Req 12.5).
 * - Last step replaces the advance button with an end-of-showcase indicator
 *   (Req 12.6).
 * - Binds global keydown: ArrowRight/ArrowLeft for advance/retreat, digits 1-5
 *   to jump to the first step of the Nth stage (Req 12.1/12.2/12.3).
 *
 * See design.md "Keyboard and Pointer Navigation".
 */
import { STAGES, STAGE_FIRST_INDEX } from '../steps/registry.js';

export function createNavControls({ bus, steps, controller, tabletRoot }) {
    const lastIndex = steps.length - 1;

    /** Guard: true while a render is in progress, prevents re-entrant calls. */
    let rendering = false;

    function renderInto(host) {
        const i = controller.getActiveIndex();
        const nav = document.createElement('div');
        nav.className = 'nav';
        if (i > 0) {
            const back = document.createElement('button');
            back.type = 'button';
            back.className = 'nav-btn btn-secondary';
            back.setAttribute('data-nav', 'retreat');
            back.setAttribute('aria-label', 'Previous step');
            back.textContent = '← Back';
            back.addEventListener('click', () => controller.retreat('nav-btn'));
            nav.appendChild(back);
        }
        if (i < lastIndex) {
            const fwd = document.createElement('button');
            fwd.type = 'button';
            fwd.className = 'nav-btn btn-primary';
            fwd.setAttribute('data-nav', 'advance');
            fwd.setAttribute('aria-label', 'Next step');
            fwd.textContent = 'Next →';
            fwd.addEventListener('click', () => controller.advance('nav-btn'));
            nav.appendChild(fwd);
        } else {
            const end = document.createElement('span');
            end.className = 'nav-end-indicator';
            end.setAttribute('data-nav', 'end');
            end.setAttribute('role', 'status');
            end.textContent = 'End of showcase';
            nav.appendChild(end);
        }
        host.appendChild(nav);
    }

    function attachAfterRender() {
        // Prevent duplicate renders if transitionComplete fires multiple times
        // in quick succession (e.g., rapid navigation or re-entrant calls).
        if (rendering) return;
        rendering = true;

        // Clear the nav-host completely before rendering a single nav element.
        tabletRoot.innerHTML = '';
        renderInto(tabletRoot);

        rendering = false;
    }

    // Attach exactly one bus listener. Store the unsubscribe handle for destroy().
    const unsubscribe = bus.on('transitionComplete', attachAfterRender);

    // Initial render.
    attachAfterRender();

    // Global keyboard bindings.
    function isInTextInput(target) {
        if (!target) return false;
        const tag = (target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
        if (target.isContentEditable) return true;
        return false;
    }

    function onKey(e) {
        if (isInTextInput(e.target)) return;
        if (e.key === 'ArrowRight') {
            controller.advance('arrow-key');
            e.preventDefault();
            return;
        }
        if (e.key === 'ArrowLeft') {
            controller.retreat('arrow-key');
            e.preventDefault();
            return;
        }
        if (e.key >= '1' && e.key <= String(STAGES.length)) {
            const stage = STAGES[Number(e.key) - 1];
            const idx = STAGE_FIRST_INDEX[stage];
            if (typeof idx === 'number') {
                controller.goTo(idx, 'digit-key');
                e.preventDefault();
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKey);
    }

    return {
        sync: attachAfterRender,
        destroy: () => {
            if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey);
            // Remove the bus listener to prevent orphaned subscriptions.
            if (typeof unsubscribe === 'function') unsubscribe();
        },
    };
}
