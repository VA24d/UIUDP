/**
 * Presenter Notes — slide-up drawer showing talking points for the active step.
 *
 * - Toggle with `P` key (when focus not in text input)
 * - Each step in the registry can declare a `notes?: string[]` field
 * - Drawer slides up from the bottom of the viewport
 * - Shows a persistent hint pill (bottom-right corner, "P  Presenter notes")
 */
export function createPresenterNotes({ bus, steps }) {
    // ── DOM construction ───────────────────────────────────────────────────
    const drawer = document.createElement('div');
    drawer.className = 'presenter-notes-drawer';
    drawer.setAttribute('role', 'complementary');
    drawer.setAttribute('aria-label', 'Presenter notes');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(drawer);

    // Keyboard hint pill (bottom-right, always visible)
    const hint = document.createElement('div');
    hint.className = 'pn-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = `<kbd>P</kbd> Presenter notes`;
    document.body.appendChild(hint);

    let isOpen = false;
    let currentStepIndex = 0;

    // ── Render ─────────────────────────────────────────────────────────────
    function render(stepIndex) {
        currentStepIndex = stepIndex;
        const step = steps[stepIndex];
        const notes = step?.notes || [];

        drawer.innerHTML = `
            <div class="pn-header">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span class="pn-title">Presenter Notes</span>
                    <span class="pn-badge">${step?.stage || ''} · ${step?.label || ''}</span>
                </div>
                <button type="button" class="pn-close" aria-label="Close presenter notes">✕</button>
            </div>
            <div class="pn-notes">
                ${notes.length
                    ? notes.map(n => `
                        <div class="pn-note">
                            <span class="pn-note-text">${n}</span>
                        </div>`).join('')
                    : `<div class="pn-note"><span class="pn-note-text" style="color:var(--color-text-secondary)">No notes for this step.</span></div>`
                }
            </div>
        `;
        drawer.querySelector('.pn-close').addEventListener('click', close);
    }

    function open(stepIndex) {
        isOpen = true;
        render(stepIndex ?? currentStepIndex);
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        hint.style.opacity = '0.3';
    }

    function close() {
        isOpen = false;
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        hint.style.opacity = '0.7';
    }

    function toggle(stepIndex) {
        if (isOpen) close();
        else open(stepIndex ?? currentStepIndex);
    }

    // ── Step change — refresh content while open ───────────────────────────
    bus.on('stepDidChange', ({ toIndex }) => {
        currentStepIndex = toIndex;
        if (isOpen) render(toIndex);
    });

    // ── Keyboard `P` ──────────────────────────────────────────────────────
    function isInTextInput(el) {
        if (!el) return false;
        const t = (el.tagName || '').toLowerCase();
        return t === 'input' || t === 'textarea' || t === 'select' || el.isContentEditable;
    }

    function onKeydown(e) {
        if (isInTextInput(e.target)) return;
        if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            toggle(currentStepIndex);
        }
        // Escape closes
        if (e.key === 'Escape' && isOpen) close();
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKeydown);
    }

    // Initial render (closed)
    render(0);

    return {
        open,
        close,
        toggle,
        isOpen: () => isOpen,
        destroy: () => {
            if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);
            drawer.remove();
            hint.remove();
        },
    };
}
