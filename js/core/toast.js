/**
 * Non-blocking toast component for hash-error recovery (Req 13.3).
 * Auto-dismisses after 5 s; also has a manual dismiss button.
 * Uses role="alert" so screen readers announce it immediately.
 */
export function showHashErrorToast({ host, fragment, onDismiss }) {
    if (!host) return;
    const toast = document.createElement('div');
    toast.className = 'toast toast--slide-in';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML = `
        <div>
            <p class="toast-msg">Unknown deep link — started at the intro instead.</p>
            <p class="toast-frag">${fragment || '(empty)'}</p>
        </div>
        <button type="button" class="toast-dismiss btn-ghost" aria-label="Dismiss message">✕</button>
    `;
    function dismiss() {
        toast.classList.add('toast--slide-out');
        setTimeout(() => {
            toast.remove();
            if (typeof onDismiss === 'function') onDismiss();
        }, 250);
    }
    toast.querySelector('.toast-dismiss').addEventListener('click', dismiss);
    // Auto-dismiss after 5 s
    const autoTimer = setTimeout(dismiss, 5000);
    toast.addEventListener('mouseenter', () => clearTimeout(autoTimer));
    host.appendChild(toast);
}
