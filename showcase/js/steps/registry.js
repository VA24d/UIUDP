/**
 * Step registry. Canonical, ordered list of 14 Step descriptors across 5 Stages.
 * See design.md "Data Models" and "Global Step sequence".
 *
 * Later tasks replace each stub render fn by importing the real renderers from
 * js/modules/{intro,onboarding,driving,riding,summary}.js and merging them in.
 * The registry is the SINGLE SOURCE OF TRUTH for what Step exists at which index.
 */

export const STAGES = /** @type {const} */ (['intro', 'onboarding', 'driving', 'riding', 'summary']);

/**
 * @typedef {Object} TrustMoment
 * @property {string} id
 * @property {string} text
 */

/**
 * @typedef {Object} TimedEvent
 * @property {string} id
 * @property {number} atMs
 */

/**
 * @typedef {Object} Step
 * @property {string} id
 * @property {number} globalIndex
 * @property {'intro'|'onboarding'|'driving'|'riding'|'summary'} stage
 * @property {string} slug
 * @property {string} label
 * @property {string} title
 * @property {TrustMoment[]} trustMoments
 * @property {TimedEvent[]=} timedEvents
 * @property {boolean=} voice
 * @property {(host: HTMLElement, step: Step) => void} renderCluster
 * @property {(host: HTMLElement, step: Step) => void} renderTablet
 */

/** No-op render stub so placeholder steps are callable without crashing. */
function stubRender(host, step) {
    host.innerHTML = `<div class="step-stub"><p class="t-caption">${step.stage}</p><h2 class="t-heading">${step.title}</h2></div>`;
}

/** Default descriptor list. Stage modules later override their entries. */
const DEFAULTS = [
    // Intro
    { id: 'intro.welcome', stage: 'intro', slug: 'welcome', label: 'Welcome', title: 'Welcome to your AeroDrive', trustMoments: [] },

    // Onboarding
    { id: 'onboarding.profile', stage: 'onboarding', slug: 'profile', label: 'Profile', title: 'Profile setup', trustMoments: [] },
    { id: 'onboarding.comfort', stage: 'onboarding', slug: 'comfort', label: 'Comfort', title: 'Comfort configuration', trustMoments: [] },
    { id: 'onboarding.locations', stage: 'onboarding', slug: 'locations', label: 'Locations', title: 'Location presets', trustMoments: [] },
    { id: 'onboarding.drive-explained', stage: 'onboarding', slug: 'drive-explained', label: 'Drive explained', title: 'How the drive works', trustMoments: [] },
    { id: 'onboarding.takeover-drill', stage: 'onboarding', slug: 'takeover-drill', label: 'Take-over drill', title: 'Practice the hand-over', trustMoments: [] },
    { id: 'onboarding.preferences', stage: 'onboarding', slug: 'preferences', label: 'Preferences', title: 'Drive preferences', trustMoments: [] },

    // Driving
    { id: 'driving.unmapped-zone', stage: 'driving', slug: 'unmapped-zone', label: 'Unmapped zone', title: 'Unmapped zone take-over', trustMoments: [] },
    { id: 'driving.fatigue', stage: 'driving', slug: 'fatigue', label: 'Fatigue watch', title: 'Fatigue protocol', trustMoments: [] },
    { id: 'driving.battery', stage: 'driving', slug: 'battery', label: 'Battery reroute', title: 'Dynamic battery management', trustMoments: [] },

    // Riding
    { id: 'riding.environment', stage: 'riding', slug: 'environment', label: 'Environment', title: 'What the car sees', trustMoments: [] },
    { id: 'riding.maneuver', stage: 'riding', slug: 'maneuver', label: 'Maneuver', title: 'Maneuver preview', trustMoments: [] },
    { id: 'riding.productive-time', stage: 'riding', slug: 'productive-time', label: 'Productive time', title: 'Your time, back', trustMoments: [] },

    // Summary
    { id: 'summary.recap', stage: 'summary', slug: 'recap', label: 'Recap', title: 'Trust, in motion', trustMoments: [] },
];

/**
 * Build a validated registry from a list of partial descriptors.
 * Assigns `globalIndex = i` in input order and asserts uniqueness of `id`
 * and of `(stage, slug)`. Throws on any duplicate or missing required field.
 *
 * @param {Array<Partial<Step>>} descriptors
 * @returns {Step[]}
 */
export function buildRegistry(descriptors) {
    if (!Array.isArray(descriptors) || descriptors.length === 0) {
        throw new Error('buildRegistry: descriptors must be a non-empty array');
    }
    const seenIds = new Set();
    const seenStageSlug = new Set();
    const out = [];
    for (let i = 0; i < descriptors.length; i++) {
        const d = descriptors[i];
        if (!d || typeof d !== 'object') {
            throw new Error(`buildRegistry: descriptor at index ${i} is not an object`);
        }
        for (const field of ['id', 'stage', 'slug', 'label', 'title']) {
            if (typeof d[field] !== 'string' || d[field].length === 0) {
                throw new Error(`buildRegistry: descriptor at index ${i} missing "${field}"`);
            }
        }
        if (!STAGES.includes(d.stage)) {
            throw new Error(`buildRegistry: descriptor at index ${i} has unknown stage "${d.stage}"`);
        }
        if (seenIds.has(d.id)) {
            throw new Error(`buildRegistry: duplicate id "${d.id}" at index ${i}`);
        }
        const key = `${d.stage}/${d.slug}`;
        if (seenStageSlug.has(key)) {
            throw new Error(`buildRegistry: duplicate (stage, slug) "${key}" at index ${i}`);
        }
        seenIds.add(d.id);
        seenStageSlug.add(key);
        out.push({
            id: d.id,
            globalIndex: i,
            stage: d.stage,
            slug: d.slug,
            label: d.label,
            title: d.title,
            trustMoments: Array.isArray(d.trustMoments) ? d.trustMoments.slice() : [],
            timedEvents: Array.isArray(d.timedEvents) ? d.timedEvents.slice() : undefined,
            voice: d.voice === true,
            renderCluster: typeof d.renderCluster === 'function' ? d.renderCluster : stubRender,
            renderTablet: typeof d.renderTablet === 'function' ? d.renderTablet : stubRender,
        });
    }
    return out;
}

/**
 * Merge a list of stage-module descriptor overrides (keyed by `id`) onto the
 * defaults, then return the validated registry. Stage modules call this at
 * boot time to replace their stub render functions with real renderers.
 *
 * @param {Array<Partial<Step>>} overrides
 */
export function buildRegistryWithOverrides(overrides = []) {
    const byId = new Map();
    for (const d of DEFAULTS) byId.set(d.id, { ...d });
    for (const o of overrides) {
        if (!o || typeof o.id !== 'string') continue;
        const base = byId.get(o.id);
        if (!base) {
            throw new Error(`buildRegistryWithOverrides: unknown step id "${o.id}"`);
        }
        byId.set(o.id, { ...base, ...o });
    }
    // Preserve canonical DEFAULTS order.
    const ordered = DEFAULTS.map(d => byId.get(d.id));
    return buildRegistry(ordered);
}

/** The canonical registry built from defaults only. Stage modules replace
 *  entries via buildRegistryWithOverrides during boot. */
export const STEPS = buildRegistry(DEFAULTS);

export const STAGE_FIRST_INDEX = Object.freeze(
    STAGES.reduce((acc, stage) => {
        const i = STEPS.findIndex(s => s.stage === stage);
        if (i >= 0) acc[stage] = i;
        return acc;
    }, /** @type {Record<string, number>} */({}))
);
