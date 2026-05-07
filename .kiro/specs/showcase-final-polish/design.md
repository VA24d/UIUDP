# Design Document — Showcase Final Polish

## Technical Context

The showcase is a single-page application built with vanilla ES modules. Key files:
- `showcase/js/modules/driving.js` — Contains `renderBatteryTablet()` with choice cards that lack click handlers
- `showcase/js/modules/riding.js` — Contains cluster renderers that are basic text-only
- `showcase/js/modules/onboarding.js` — Contains the reference hold-to-grip implementation in `renderTakeoverDrillTablet()`
- `showcase/js/core/voice.js` — Contains `createVoiceService()` which calls `startListening()` at init
- `showcase/js/main.js` — Boot sequence that wires all modules
- `showcase/js/steps/registry.js` — Step registry with `buildRegistryWithOverrides()`

## Fix 1: Battery Choice Cards (Issues 1.1, 1.2, 2.1, 2.2)

### Root Cause
In `renderBatteryTablet()` (driving.js), the choice cards (`[data-choice="reroute"]` and `[data-choice="continue"]`) have no click event listeners. Only the `[data-cta="confirm"]` button has a handler wired to `controller.advance()`.

### Solution
Add click handlers to both choice cards:
- **Reroute card**: On click, animate the route SVG (pulse the detour path, highlight the charger pin, show "Rerouting..." text), then after ~1.5s call `controller.advance()`.
- **Continue card**: On click, show a brief "Low-power mode armed" confirmation in the ETA slot, then after ~800ms call `controller.advance()`.

### Implementation
```javascript
// In renderBatteryTablet(), after existing POI tooltip wiring:
const rerouteCard = host.querySelector('[data-choice="reroute"]');
const continueCard = host.querySelector('[data-choice="continue"]');

if (rerouteCard) {
    rerouteCard.addEventListener('click', () => {
        // Visual: highlight selected card
        rerouteCard.classList.add('is-selected');
        if (continueCard) continueCard.classList.add('is-dimmed');
        
        // Animate reroute on map
        const detour = host.querySelector('.poi-route-detour');
        if (detour) detour.classList.add('route-animating');
        const chargerPin = host.querySelector('[data-poi="charger-1"]');
        if (chargerPin) chargerPin.classList.add('poi-pulse-active');
        
        // Show rerouting status
        const etaSlot = host.querySelector('[data-eta-slot]');
        if (etaSlot) etaSlot.innerHTML = '<div class="poi-eta-update">🔄 Rerouting to Supercharger… +6 min</div>';
        
        // Advance after animation
        setTimeout(() => controller.advance('driving-battery-reroute'), 1500);
    });
}

if (continueCard) {
    continueCard.addEventListener('click', () => {
        continueCard.classList.add('is-selected');
        if (rerouteCard) rerouteCard.classList.add('is-dimmed');
        
        const etaSlot = host.querySelector('[data-eta-slot]');
        if (etaSlot) etaSlot.innerHTML = '<div class="poi-eta-update">⚡ Low-power mode armed — monitoring range</div>';
        
        setTimeout(() => controller.advance('driving-battery-continue'), 800);
    });
}
```

## Fix 2: Voice Service Auto-Start (Issues 1.3, 2.3)

### Root Cause
In `createVoiceService()` (voice.js), the last line of initialization calls `startListening()` unconditionally. The Web Speech API requires a user gesture to grant microphone access in most browsers.

### Solution
Remove the `startListening()` call at the end of `createVoiceService()`. The mic toggle button click handler (`toggleMic`) already exists and will serve as the user gesture. The voice bar will show "Mic off — tap to listen" by default (which is already the initial text).

### Implementation
```javascript
// In voice.js createVoiceService(), REMOVE this line at the end:
// startListening();  // <-- DELETE THIS

// The mic toggle button click handler already calls toggleMic() which calls startListening()
// This ensures the first recognition.start() happens after a user gesture
```

## Fix 3: Riding Cluster Enhancement (Issues 1.4, 2.4)

### Root Cause
The `baseCluster()` function in riding.js renders minimal content. The `renderEnvironmentCluster()` adds only an object count. The maneuver and productive clusters add only a text line. None include the perception mini-radar, safe-zone bar, or proper passenger mode styling.

### Solution
Create an enhanced `ridingCluster()` function that renders:
1. A mini perception radar SVG (simplified version of the full one)
2. Speed readout with units
3. "PASSENGER MODE" pill (already exists in baseCluster but needs emphasis)
4. Safe-zone bar indicator (reuse `renderSafeZoneBar()` from the same module)

### Implementation
Replace the individual cluster renderers with a unified `renderRidingCluster(host, slug, ridingStepIndex)` that includes all elements:

```javascript
function renderRidingCluster(host, slug, ridingStepIndex) {
    const miniRadar = buildMiniPerceptionSVG(); // Simplified 5-object radar
    host.innerHTML = `
        <div class="cluster-title">
            <span class="t-caption cluster-context">Riding · ${SCENARIOS[slug].title}</span>
            <span class="cluster-passenger-pill">PASSENGER MODE</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:var(--sp-3);">
            <span class="cluster-speed">62</span>
            <span class="t-caption">km/h</span>
        </div>
        <div class="cluster-mini-radar">${miniRadar}</div>
        <div style="margin-top:var(--sp-2);">
            <span class="cluster-alert-pill is-success" data-cluster-pill>SERENE</span>
        </div>
        ${renderSafeZoneBar(ridingStepIndex)}
    `;
}
```

A `buildMiniPerceptionSVG()` helper renders a compact version of the perception view with 3-4 bounding boxes and the ego vehicle marker.

## Fix 4: Driving Unmapped-Zone Hold-to-Grip (Issues 1.5, 2.5)

### Root Cause
In `renderUnmappedTablet()` (driving.js), the takeover prompt that appears after 2 seconds renders a simple `<button data-cta="grip">Grip wheel</button>` with a basic click handler. It lacks the hold-to-grip mechanic (progress fill, 2.5s hold duration, spacebar support, tactile animations) that exists in the onboarding drill.

### Solution
Extract the grip mechanic from `renderTakeoverDrillTablet()` into a shared utility, or replicate the pattern in the driving unmapped-zone step. The driving version should:
1. Show a grip button with progress fill bar
2. Require press-and-hold for 2.5s (same as onboarding)
3. Support spacebar as alternative input
4. Show tactile pulse animations on the wheel icon
5. On completion, advance to next step

### Implementation
Replace the simple button in the timeout callback with the full grip mechanic HTML and wire the same `startGrip/releaseGrip/animateGrip` pattern. Add keydown/keyup listeners for spacebar.

## Fix 5: Phase Transition Cards (Issues 1.6, 1.7, 2.6, 2.7)

### Root Cause
The step registry has no transition steps between phases. The controller advances directly from the last onboarding step to the first driving step, and from the last driving step to the first riding step.

### Solution
Add two new transition steps to the registry:
1. `driving.intro` — between onboarding.preferences and driving.unmapped-zone
2. `riding.intro` — between driving.weather and riding.environment

Each transition step renders a full-screen card with:
- Phase name and icon
- Brief description of what's coming
- Auto-advance after 3 seconds
- Click-to-skip button

### Implementation
Add entries to the DEFAULTS array in registry.js and create renderers:

```javascript
// New step in registry DEFAULTS (between onboarding.preferences and driving.unmapped-zone):
{ id: 'driving.intro', stage: 'driving', slug: 'intro', label: 'Driving intro', title: 'Entering Driving Mode', trustMoments: [] }

// New step in registry DEFAULTS (between driving.weather and riding.environment):
{ id: 'riding.intro', stage: 'riding', slug: 'intro', label: 'Riding intro', title: 'Entering Passenger Mode', trustMoments: [] }
```

Renderers show a centered card with phase title, description, and auto-advance timer.

## CSS Changes

Add to `components.css`:
- `.route-animating` — stroke-dashoffset animation for reroute path
- `.poi-pulse-active` — scale pulse on charger pin
- `.is-selected` / `.is-dimmed` for choice cards
- `.cluster-mini-radar` — sizing for the mini perception SVG in cluster
- `.transition-card` — full-bleed centered card for phase transitions
- `.grip-button`, `.grip-fill`, `.tactile-pulse-*` — already exist from onboarding, ensure they work in driving context too

## Correctness Properties

### Fix Checking

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type UserInteraction
  OUTPUT: boolean
  
  RETURN X.action IN {
    "click-reroute-card",
    "click-continue-card", 
    "boot-without-gesture",
    "view-riding-cluster",
    "driving-unmapped-grip",
    "transition-onboarding-to-driving",
    "transition-driving-to-riding"
  }
END FUNCTION
```

```pascal
// Property: Fix Checking — Choice cards trigger animation + advance
FOR ALL X WHERE X.action = "click-reroute-card" DO
  result ← renderBatteryTablet'(X)
  ASSERT result.animationPlayed = true
  ASSERT result.advancedAfterDelay = true
END FOR
```

```pascal
// Property: Fix Checking — Voice does not auto-start
FOR ALL X WHERE X.action = "boot-without-gesture" DO
  result ← createVoiceService'(X)
  ASSERT result.isListening = false
  ASSERT result.recognitionStarted = false
END FOR
```

### Preservation Checking

```pascal
// Property: Preservation — Confirm button still works
FOR ALL X WHERE NOT isBugCondition(X) AND X.action = "click-confirm-button" DO
  ASSERT F(X) = F'(X)
END FOR
```

```pascal
// Property: Preservation — Mic works after user click
FOR ALL X WHERE X.action = "click-mic-button" DO
  ASSERT F'(X).isListening = true
END FOR
```
