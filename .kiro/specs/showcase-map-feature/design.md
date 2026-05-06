# Showcase Map & Premium Cockpit Bugfix Design

## Overview

The showcase prototype suffers from four interconnected deficiencies that undermine its purpose as a premium AV demonstration: (1) the Locations step and Battery reroute step lack interactive map visualizations, (2) the UI uses a flat light theme instead of the immersive dark cockpit aesthetic with glass-morphism, (3) the mic/voice system silently fails with no visual error states or recovery mechanisms, and (4) the Preferences step renders as a basic web form instead of a premium car tuning interface.

The fix converts the entire visual layer to a dark cockpit theme, adds SVG-based interactive maps with route animations and POI interactions, hardens the voice system with proper error handling and visual states, and rebuilds the Preferences step as a premium tuning interface with animated transitions.

## Glossary

- **Bug_Condition (C)**: The set of UI states where the showcase fails to deliver its intended premium cockpit experience — missing map visualizations, flat light theme, silent mic failures, and basic form-style preferences
- **Property (P)**: The desired behavior — immersive dark glass-morphism UI, interactive SVG maps with route animations, resilient mic with visual feedback, and animated premium preferences
- **Preservation**: Existing navigation flow, step advancement via `completeThenAdvance`, voice command routing, timeline state, responsive stacking, and reduced-motion compliance must remain unchanged
- **Glass-morphism**: Translucent dark surfaces with `backdrop-filter: blur()`, luminous borders, and deep shadows creating depth
- **POI**: Point of Interest — clickable map markers (chargers, food, scenic) that reveal detail tooltips
- **HUD**: Head-Up Display panel in the cluster showing battery, progress, alerts, and drive profile meters

## Bug Details

### Bug Condition

The bug manifests across four areas when the showcase renders specific steps or when the voice system encounters errors. The visual theme is globally incorrect (light instead of dark), the Locations and Battery steps lack map interactivity, the mic system has no error recovery UI, and the Preferences step uses basic flat buttons with emoji cars.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { step: StepId, interaction: InteractionType, voiceState: VoiceState }
  OUTPUT: boolean
  
  RETURN (input.step == 'onboarding.locations' AND expectsMapVisualization(input))
         OR (input.step == 'driving.battery' AND expectsMapWithReroute(input))
         OR (input.interaction == 'page-load' AND themeIsLight())
         OR (input.voiceState == 'error' AND noVisualErrorFeedback())
         OR (input.step == 'onboarding.preferences' AND expectsPremiumTuningUI(input))
END FUNCTION
```

### Examples

- **Map Missing**: User navigates to Locations step → sees only "🏠 Home" and "💼 Work" text labels with no map, no route, no POI markers
- **Reroute No Visual**: User clicks "Reroute to nearest charger" → step advances with no animated route change, no ETA update on map
- **Light Theme**: Page loads → white backgrounds, beige page color, no glass-morphism, no ambient glow
- **Mic Silent Fail**: Browser denies mic permission → no error message shown, mic button unchanged
- **Flat Preferences**: User opens Preferences step → sees flat buttons with emoji 🚗 car, no G-force meter, no smooth animations

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `completeThenAdvance()` flow — all steps must continue to advance via the existing 350ms pill + controller.advance pattern
- Timeline node states, trust moment counter, and stage-entry flourish animations
- Voice command routing: "next", "back", "complete" navigation; zone names for comfort; slide names for drive-explained
- Keyboard navigation (arrow keys, spacebar for takeover drill)
- Responsive stacking below 1100px
- `prefers-reduced-motion: reduce` disabling all animations
- HUD panel existing indicators (gear, battery, progress, alerts)
- Voice service `navBlockedUntil` 900ms echo prevention and 1500ms command cooldown
- Levenshtein ≤ 3 fuzzy matching threshold

**Scope:**
All inputs that do NOT involve the four bug areas (map rendering, theme application, mic error handling, preferences UI) should be completely unaffected. This includes:
- Profile step biometric flow (camera, voice capture)
- Comfort step seat zone adjustments
- Drive-explained slideshow
- Takeover drill countdown + grip mechanic
- All three driving scenarios (unmapped zone, fatigue, battery choice cards)
- Riding module steps
- Summary recap

## Hypothesized Root Cause

Based on the bug description, the issues are:

1. **Missing Map Implementation**: `renderLocationsTablet()` in `onboarding.js` renders only two static `<label>` elements. No SVG map component exists. `renderBatteryTablet()` in `driving.js` renders only choice cards with no map integration. The `map-route.svg` asset exists but is never loaded or made interactive.

2. **Wrong Theme Applied**: `tokens.css` defines only `:root.theme-light` variables. `theme-system.js` applies `theme-light` class. No dark theme token set exists. `layout.css` uses `var(--color-surface-page)` which resolves to `#F6F5F2` (light beige). The cluster and tablet use `var(--color-surface-elevated)` → `#FFFFFF`.

3. **No Mic Error UI**: In `voice.js`, `recognition.onerror` only calls `console.warn()`. The `startListening()` function catches errors silently. No retry logic with backoff exists. The mic button has only `.listening` class — no `.is-error` state.

4. **Basic Preferences Renderer**: `renderPreferencesTablet()` does a full `host.innerHTML = ...` on every state change (causing flash). Uses emoji `🚗` and `🚙` for cars. No G-force visualization. Lane position uses inline `left:` with no transition. No road texture or lane markings.

## Correctness Properties

Property 1: Bug Condition - Interactive Map Renders with POIs and Route Animation

_For any_ step where the bug condition holds (Locations or Battery step is active), the fixed renderer SHALL display an SVG-based interactive map with clickable POI markers, animated route lines, and HUD integration — clicking POIs shows tooltips, selecting reroute triggers stroke animation over 1.5s, and HUD updates ETA/battery.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

Property 2: Bug Condition - Dark Cockpit Theme with Glass-morphism

_For any_ page load where the theme is applied, the fixed system SHALL render dark radial-gradient background, translucent panels with backdrop-filter blur(40px), luminous borders, ambient glow on accent elements, and refined typography with font-weight 300 body text.

**Validates: Requirements 2.9, 2.10, 2.11, 2.12, 2.13**

Property 3: Bug Condition - Mic Error States with Visual Feedback and Recovery

_For any_ voice system error (permission denied, network error, timeout), the fixed system SHALL display a human-readable message in the voice bar, apply error visual state to the mic button, attempt recovery with exponential backoff (1s, 2s, 4s, max 3 retries), and show a manual retry button after all retries fail.

**Validates: Requirements 2.14, 2.15, 2.16, 2.17**

Property 4: Bug Condition - Premium Preferences Tuning Interface

_For any_ preference change in the Preferences step, the fixed renderer SHALL animate transitions smoothly (no full re-render flash), show a proper car SVG on a road with lane markings, animate lane changes over 500ms, animate following distance changes over 400ms, and display a G-force meter that fills based on acceleration mode.

**Validates: Requirements 2.18, 2.19, 2.20, 2.21, 2.22, 2.23**

Property 5: Preservation - Existing Navigation and Step Flow

_For any_ input where the bug condition does NOT hold (non-map steps, non-theme elements, non-error voice states, non-preferences steps), the fixed code SHALL produce the same behavior as the original code, preserving all existing step advancement, voice routing, timeline states, and responsive behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

## Fix Implementation

### Changes Required

**File**: `showcase/css/tokens.css`

**Changes**:
1. **Add dark theme token set**: Create `:root.theme-dark` (or just `:root`) with dark colors — page background as radial-gradient, elevated surfaces as `rgba(25, 25, 30, 0.7)`, accent glow variants, refined typography weights
2. **Replace light as default**: Make dark theme the default applied class, or change `theme-system.js` to apply `theme-dark`

**File**: `showcase/css/layout.css`

**Changes**:
1. **Glass-morphism panels**: Update `.cluster` and `.tablet` to use translucent dark backgrounds, `backdrop-filter: blur(40px)`, luminous borders, deep box-shadows
2. **Dark page background**: Update `.stage` background to dark radial-gradient
3. **Accent bar glow**: Update the `::before` accent bar to glow

**File**: `showcase/css/components.css`

**Changes**:
1. **Add map component styles**: `.map-container`, `.map-poi`, `.map-route-line`, `.map-tooltip`, `.map-car-marker` with glow effects
2. **Add preferences premium styles**: `.prefs-road-preview`, `.prefs-car-svg`, `.prefs-gforce-meter`, `.prefs-lane-marking` with transitions
3. **Add mic error states**: `.voice-bar-mic.is-error`, `.voice-bar-retry`, animated listening ring
4. **Update existing components for dark theme**: Buttons, choice cards, trust moments, timeline nodes

**File**: `showcase/js/modules/onboarding.js`

**Function**: `renderLocationsTablet()`

**Changes**:
1. **Replace static labels with interactive SVG map**: Embed/load the map SVG, add clickable POI markers with event listeners
2. **Add route visualization**: Curved path from Home to Work with color-coded autonomy segments
3. **Add POI tooltip system**: Click handlers that show detail cards with "Add to route" buttons
4. **Add voice command integration**: "show map", "add stop" commands
5. **Update HUD on interactions**: Emit bus events for route changes

**Function**: `renderPreferencesTablet()`

**Changes**:
1. **Replace full re-render with targeted DOM updates**: Use `requestAnimationFrame` and CSS transitions instead of `innerHTML` on every change
2. **Replace emoji cars with SVG**: Proper car silhouette on a road with lane markings
3. **Add G-force meter**: Animated bar that fills based on acceleration mode
4. **Add smooth lane-change animation**: CSS transform with 500ms transition
5. **Add following distance animation**: Lead car position animated over 400ms
6. **Add road texture**: Scrolling dashed lines to simulate motion

**File**: `showcase/js/modules/driving.js`

**Function**: `renderBatteryTablet()`

**Changes**:
1. **Add map alongside choice cards**: Split layout with map on left, choices on right
2. **Show original route (dashed) and reroute (solid accent)**: Two SVG paths
3. **Animate reroute on selection**: Stroke-dashoffset animation over 1.5s, charger marker pulse
4. **Update HUD**: ETA +6 min, battery projection 15% → 80%
5. **Add cockpit annotation**: Narrate the reroute decision

**File**: `showcase/js/core/voice.js`

**Function**: `createVoiceService()`

**Changes**:
1. **Add error state UI**: `.is-error` class on mic button, error message in voice bar text
2. **Add exponential backoff retry**: 1s, 2s, 4s delays with max 3 retries counter
3. **Add manual retry button**: After 3 failures, show persistent "Retry" button in voice bar
4. **Add animated listening ring**: Pulsing accent glow when actively listening (`.is-listening` with keyframe)
5. **Add permission denied handling**: Specific message for `NotAllowedError`

**File**: `showcase/js/core/theme-system.js`

**Changes**:
1. **Switch default theme to dark**: `applyTheme()` should add `theme-dark` class to `<html>`

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Write tests that render each affected step and assert the presence of map elements, dark theme tokens, mic error UI, and premium preferences components. Run on UNFIXED code to observe failures.

**Test Cases**:
1. **Locations Map Test**: Render Locations step → assert SVG map element exists with POI markers (will fail on unfixed code)
2. **Battery Reroute Map Test**: Render Battery step → assert map with route paths exists alongside choice cards (will fail on unfixed code)
3. **Dark Theme Test**: Load page → assert computed background-color is dark, not `#F6F5F2` (will fail on unfixed code)
4. **Mic Error State Test**: Simulate permission denied → assert error message visible in voice bar (will fail on unfixed code)
5. **Preferences Animation Test**: Change acceleration → assert no full innerHTML replacement, G-force meter exists (will fail on unfixed code)

**Expected Counterexamples**:
- Locations step renders only two `<label>` elements with no `<svg>` or `.map-container`
- Battery step has no map element, only `.choice-list`
- Page background computes to `rgb(246, 245, 242)` instead of dark
- Voice bar shows no error text on permission denial
- Preferences step does full `host.innerHTML` on every click

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderStep_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderStep_original(input) = renderStep_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for navigation, voice commands, and non-affected steps, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Navigation Preservation**: Verify `completeThenAdvance` still works for all steps after theme/map changes
2. **Voice Command Preservation**: Verify "next", "back", zone names, slide names all continue routing correctly
3. **Timeline Preservation**: Verify timeline node states update correctly through all steps
4. **Responsive Preservation**: Verify stacking below 1100px still works with new map/preferences layouts

### Unit Tests

- Test SVG map POI click handlers produce correct tooltip content
- Test route animation stroke-dashoffset calculation
- Test exponential backoff timing (1s, 2s, 4s)
- Test preferences state changes produce correct CSS transform values
- Test dark theme token values resolve correctly

### Property-Based Tests

- Generate random step navigation sequences and verify timeline state consistency
- Generate random preference combinations and verify HUD sync values
- Generate random voice error sequences and verify retry count never exceeds 3
- Test that all non-affected steps render identically before and after fix

### Integration Tests

- Test full flow: Locations → interact with map → advance → verify HUD updated
- Test Battery reroute: select reroute → verify animation triggers → verify HUD ETA change
- Test mic lifecycle: deny permission → see error → tap retry → verify recovery attempt
- Test preferences: change all three options → verify no flash, smooth animations, HUD sync
