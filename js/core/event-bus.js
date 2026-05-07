/**
 * Tiny pub/sub event bus. See design.md "Event bus".
 *
 * Contract:
 *   - on(type, fn) -> unsubscribe function
 *   - off(type, fn) -> void
 *   - emit(type, payload) -> void (swallows listener errors so one bad listener
 *     cannot break the others; errors are logged for debugging).
 */
export function createBus() {
    /** @type {Map<string, Set<Function>>} */
    const listeners = new Map();

    function on(type, fn) {
        if (typeof fn !== 'function') {
            throw new TypeError(`bus.on: expected function, got ${typeof fn}`);
        }
        let set = listeners.get(type);
        if (!set) {
            set = new Set();
            listeners.set(type, set);
        }
        set.add(fn);
        return () => off(type, fn);
    }

    function off(type, fn) {
        const set = listeners.get(type);
        if (!set) return;
        set.delete(fn);
        if (set.size === 0) listeners.delete(type);
    }

    function emit(type, payload) {
        const set = listeners.get(type);
        if (!set || set.size === 0) return;
        // Snapshot so listeners that unsubscribe themselves during emit do not
        // mutate the iteration.
        const snapshot = Array.from(set);
        for (const fn of snapshot) {
            try {
                fn(payload);
            } catch (err) {
                // Log and continue; never let one bad listener break the bus.
                // eslint-disable-next-line no-console
                console.error(`[bus] listener for "${type}" threw:`, err);
            }
        }
    }

    function clear() {
        listeners.clear();
    }

    return { on, off, emit, clear };
}
