/**
 * Step registry. Canonical, ordered list of 15 Step descriptors across 5 Stages.
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
 * @property {string[]=} notes  Presenter talking points shown in the P-key drawer
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
    { id: 'driving.unmapped-zone', stage: 'driving', slug: 'unmapped-zone', label: 'Unmapped zone', title: 'Unmapped zone take-over', trustMoments: [],
      notes: ['This is a spontaneous event — the car cannot proceed autonomously into unmapped territory.', 'The driver is given a clear, calm prompt with the reason and a single action to take.', 'Key message: AeroDrive asks permission before every handover — it never surprises you.'] },
    { id: 'driving.fatigue', stage: 'driving', slug: 'fatigue', label: 'Fatigue watch', title: 'Fatigue protocol', trustMoments: [],
      notes: ['Three-level escalation mirrors real drowsiness progression (attention → warning → critical).', 'Each level uses a visually distinct alert state — colour + animation intensity increase.', 'Emphasise: the system is watching for your safety, not monitoring you for surveillance.'] },
    { id: 'driving.battery', stage: 'driving', slug: 'battery', label: 'Battery reroute', title: 'Dynamic battery management', trustMoments: [],
      notes: ['The map shows range math transparently — no hidden estimates.', 'Two honest options: recommended detour (charger) or continue on planned route.', 'POI pins are clickable — tap the charger or rest stop to see ETA impact.', 'Key message: Range math is shown, not hidden.'] },
    { id: 'driving.weather', stage: 'driving', slug: 'weather', label: 'Weather sensors', title: 'Sensor degradation in rain', trustMoments: [{ id: 'driving.weather.sensor-transparency', text: 'Sensor limits shown in real time, not hidden' }],
      notes: ['Heavy rain reduces lidar and camera effective range from 120m to ~60m.', 'The radar visualisation shows the degraded detection cone in real-time.', 'AeroDrive slows and increases following distance automatically — this is shown on the HUD.', 'Key message: You always know what the car can and cannot see.'] },

    // Riding
    { id: 'riding.environment', stage: 'riding', slug: 'environment', label: 'Environment', title: 'What the car sees', trustMoments: [],
      notes: ['The perception HUD shows all detected objects with bounding boxes and distance labels.', 'Green = vehicles, Amber = pedestrians, Blue = signs/infrastructure.', 'Key message: You see what the car sees — nothing is hidden from the passenger.'] },
    { id: 'riding.maneuver', stage: 'riding', slug: 'maneuver', label: 'Maneuver', title: 'Maneuver preview', trustMoments: [],
      notes: ['The tablet shows the upcoming turn 3 seconds before the car executes it.', 'This gives passengers time to brace and eliminates surprise — critical for trust.', 'Key message: You see the turn before the car makes it.'] },
    { id: 'riding.productive-time', stage: 'riding', slug: 'productive-time', label: 'Productive time', title: 'Your time, back', trustMoments: [],
      notes: ['Only offered when the autonomy budget is stable and the route is clear.', 'Tasks are sourced from the user\'s real calendar and email (simulated here).', 'The system will interrupt if conditions change — it never silently disengages.'] },

    // Summary
    { id: 'summary.recap', stage: 'summary', slug: 'recap', label: 'Recap', title: 'Trust, in motion', trustMoments: [],
      notes: ['Walk through the Trust Moment count — each shield icon represents a transparency disclosure.', 'Invite questions from the audience about any specific scenario.', 'The "Restart showcase" button loops back to the beginning for the next participant.'] },
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
            notes: Array.isArray(d.notes) ? d.notes.slice() : [],
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
