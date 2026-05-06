/**
 * Timeline — persistent horizontal navigation with filled / active / unfilled
 * nodes, one per Step. Supports click and keyboard jump to any Node.
 *
 * See design.md "Timeline component".
 */
export function createTimeline({ bus, steps, controller, host }) {
    if (!host) throw new TypeError('createTimeline: host required');

    host.classList.add('tl-root');

    function visualStateClass(i, active) {
        if (i < active) return 'is-filled';
        if (i === active) return 'is-active';
        return 'is-unfilled';
    }

    function render() {
        const active = controller.getActiveIndex();
        const trustCount = controller.getTrustCount();
        const nodesHtml = steps.map((s, i) => {
            const state = visualStateClass(i, active);
            const ariaCurrent = i === active ? 'step' : 'false';
            const label = `${s.stage} — ${s.label}`;
            return `
                <li class="tl-item" role="listitem">
                    <button
                        type="button"
                        class="tl-node ${state}"
                        data-index="${i}"
                        data-stage="${s.stage}"
                        tabindex="0"
                        aria-current="${ariaCurrent}"
                        aria-label="${label}"
                        title="${label}"
                    >
                        <span class="tl-dot" aria-hidden="true"></span>
                        <span class="tl-label t-caption">${s.label}</span>
                    </button>
                </li>
            `;
        }).join('');

        host.innerHTML = `
            <div class="tl-row">
                <ol class="tl-list" role="list" aria-label="Showcase timeline">
                    ${nodesHtml}
                </ol>
                <div class="tl-trust" role="group" aria-label="Cumulative trust moments">
                    <span class="tl-trust-num" aria-live="polite">${trustCount}</span>
                    <span class="tl-trust-cap t-caption">Trust moments</span>
                </div>
            </div>
        `;

        host.querySelectorAll('.tl-node').forEach((btn) => {
            const idx = Number(btn.dataset.index);
            btn.addEventListener('click', () => controller.goTo(idx, 'timeline-click'));
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
                    e.preventDefault();
                    controller.goTo(idx, 'timeline-key');
                }
            });
        });
    }

    // Initial render.
    render();

    // Re-render on step changes and transition settlement (keeps the counter
    // stable even if an animation is cancelled mid-way).
    const offDid = bus.on('stepDidChange', render);
    const offComp = bus.on('transitionComplete', render);

    /**
     * Stage-entry flourish (P15 / Req 7.5). Wired here so the Timeline owns
     * the visual; the class is removed after --motion-dur-stage (600ms).
     */
    bus.on('stepDidChange', ({ fromIndex, toIndex }) => {
        const fromStage = steps[fromIndex]?.stage;
        const toStage = steps[toIndex]?.stage;
        if (!fromStage || !toStage || fromStage === toStage) return;
        const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(() => fn(Date.now()), 0);
        raf(() => {
            host.classList.add('is-stage-enter');
            setTimeout(() => host.classList.remove('is-stage-enter'), 600);
        });
    });

    return {
        render,
        destroy: () => { offDid(); offComp(); },
    };
}
