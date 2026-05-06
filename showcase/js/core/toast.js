/**
 * Non-blocking toast component for hash-error recovery (Req 13.3).
 * Renders above the Timeline and exposes a dismiss button that clears the
 * invalid hash fragment.
 */
export function showHashErrorToast({ host, fragment, onDismiss }) {
    if (!host) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
        <div>
            <p class="toast-msg">Unknown deep link — started at the intro instead.</p>
            <p class="toast-frag">${fragment || '(empty)'}</p>
        </div>
        <button type="button" class="toast-dismiss btn-ghost" aria-label="Dismiss message">Dismiss</button>
    `;
    toast.querySelector('.toast-dismiss').addEventListener('click', () => {
        toast.remove();
        if (typeof onDismiss === 'function') onDismiss();
    });
    host.appendChild(toast);
}
