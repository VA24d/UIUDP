# Showcase Nav & Feature Parity Bugfix Design

## Overview

The showcase application has two categories of defects: (1) a rendering bug where multiple "← Back" buttons accumulate in the nav-host area, and (2) a feature-parity gap where the original prototype's rich interactive features (always-on voice, interactive seat zones, slideshow navigation, hold-to-grip simulation, tuning sliders, HUD, cockpit annotations, persistent voice bar) were reduced to static placeholders or omitted entirely during the port. This design formalizes the bug conditions, defines the expected behaviors, hypothesizes root causes, and plans a systematic fix that restores and enhances all missing interactivity.

## Glossary

- **Bug_Condition (C)**: The set of conditions that trigger defective behavior — either multiple back buttons rendering, or interactive features being absent/non-functional when a step renders
- **Property (P)**: The desired behavior — exactly one back button in nav, and full interactive features matching or exceeding the original prototype on every step
- **Preservation**: Existing behaviors that must remain unchanged — step transitions, animation crossfades, timeline navigation, hash routing, event bus ordering, trust moment counting
- **nav-controls.js**: The module in `showcase/js/core/nav-controls.js` that renders Back/Next buttons into `.nav-host` on every `transitionComplete` event
- **voice.js**: The module in `showcase/js/core/voice.js` that currently only provides mic permission and recognition for the profile step
- **onboarding.js**: The module in `showcase/js/modules/onboarding.js` that renders all 6 onboarding step tablets with simplified/static content
- **navBlockedUntil**: A timestamp pattern from the original prototype that prevents voice→mic echo from triggering false navigation commands after TTS ends

## Bug Details

### Bug Condition

The bugs manifest in two forms: (1) when the nav-controls module appends a new `.nav` element on every `transitionComplete` event without clearing previous nav elements from the host, causing Back buttons to accumulate; and (2) when any onboarding step renders, it produces static/placeholder content instead of the interactive widgets present in the original prototype.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { event: string, stepSlug: string, navHostChildren: number }
  OUTPUT: boolean
  
  // Bug 1: Multiple back buttons
  IF input.event == 'transitionComplete' 
     AND input.navHostChildren > 1
  THEN RETURN true
  
  // Bug 2: Missing interactivity on any onboarding step
  IF input.stepSlug IN ['profile', 'comfort', 'drive-explained', 'takeover-drill', 'preferences']
     AND NOT hasFullInteractivity(input.stepSlug)
  THEN RETURN true
  
  // Bug 3: Voice not active outside profile step
  IF input.stepSlug != 'profile'
     AND voiceRecognitionActive == false
  THEN RETURN true
  
  // Bug 4: No HUD panel visible
  IF hudPanelVisible == false
  THEN RETURN true
  
  RETURN false
END FUNCTION
```

### Examples

- **Multiple Back buttons**: Navigate forward 5 steps → nav-host contains 5 stacked `.nav` divs each with a Back button, instead of exactly 1
- **Static comfort step**: Comfort step shows 3 text tiles ("Seat: Preset 1") instead of an interactive seat diagram with clickable zones, height/tilt sliders, temperature control, and ambient lighting picker
- **Dead voice on step 3**: User says "next" on the Locations step → nothing happens because voice recognition stopped after profile step completed
- **No HUD**: No gear indicator, battery status, g-force meter, or contextual alerts visible anywhere in the UI
- **Static slideshow**: Drive Explained step shows only slide 1 text with no prev/next buttons, no slide counter, no indicator dots
- **Click-only takeover**: Take-over drill has a simple click button instead of a press-and-hold mechanic with progress fill, spacebar support, and failsafe stage

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Step transitions with animation controller crossfade (opacity + translateY) must continue working
- Timeline click/keyboard navigation to any step must remain functional
- Hash-based deep linking and error toasts for invalid hashes must remain functional
- Event bus ordering (stepWillChange → stepDidChange → transitionComplete) must remain unchanged
- Trust moment counting and display in timeline must remain unchanged
- Keyboard shortcuts (ArrowRight/Left, digit keys 1-5 for stage jumps) must continue working
- The deterministic boot order (theme → bus → registry → router → controller → animation → timeline → nav → render) must remain unchanged
- completeThenAdvance flow for step CTAs must continue working

**Scope:**
All inputs that do NOT involve the nav rendering bug or the missing interactive features should be completely unaffected by this fix. This includes:
- Timeline node interactions
- Hash routing decode/encode
- Theme system application
- Screen reader announcements
- Toast notifications
- Animation controller crossfade timing

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Nav Button Accumulation (Bug 1)**: The `createNavControls` function's `attachAfterRender` method sets `tabletRoot.innerHTML = ''` then calls `renderInto(tabletRoot)` — but `tabletRoot` here is `.nav-host`. The issue is that `transitionComplete` fires on every step change, and if the nav-host is not properly cleared or if multiple listeners accumulate, buttons stack up. Looking at the code, `tabletRoot.innerHTML = ''` should clear it, but the bus listener `bus.on('transitionComplete', attachAfterRender)` may fire multiple times if `createNavControls` is called more than once, or there may be a race with the initial `attachAfterRender()` call at the bottom.

2. **Voice Only Active During Profile (Bug 2)**: The current `voice.js` module is designed as a single-step utility — it starts recognition in `renderProfileTablet` and stops it when the user clicks "Save profile". There is no global voice service that persists across steps. The original prototype's `initRecognition()` + `toggleMic()` pattern on DOMContentLoaded is completely absent.

3. **Static Onboarding Steps (Bug 3)**: The `onboarding.js` renderers were written as simplified placeholders. The comfort step renders 3 static tiles, the drive-explained step renders only slide 1 text, the takeover-drill uses a simple countdown + click button, and preferences shows choice cards instead of sliders. The original prototype's rich HTML templates and interactive logic were not ported.

4. **Missing HUD and Voice Bar (Bug 4)**: The `showcase/index.html` has no HUD markup or voice bar markup. The original `index.html` has a full HUD panel (`#hud-panel`) with gear, battery, g-force, safety dots, alerts, and a voice bar (`#voice-bar`) with mic toggle and heard-text display. These were never added to the showcase.

5. **Missing Cockpit Annotations (Bug 5)**: The original has a `#cockpit-annotation` element that updates contextually per step. This element and its update logic are absent from the showcase.

## Correctness Properties

Property 1: Bug Condition - Nav Controls Render Exactly One Set

_For any_ step transition where `transitionComplete` fires, the `.nav-host` element SHALL contain exactly one `.nav` child with at most one Back button (hidden on first step) and one Next button (or end indicator on last step), regardless of how many transitions have occurred.

**Validates: Requirements 2.1**

Property 2: Bug Condition - Interactive Features Present on Each Step

_For any_ onboarding step that renders (profile, comfort, drive-explained, takeover-drill, preferences), the tablet content SHALL contain the full set of interactive widgets specified in requirements 2.2–2.6, not static placeholders.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6**

Property 3: Bug Condition - Always-On Voice Recognition

_For any_ step in the showcase (excluding driving simulator), the voice recognition service SHALL be active and processing commands, responding to navigation commands ("next", "back") and step-specific commands with fuzzy matching (levenshtein ≤ 3).

**Validates: Requirements 2.8, 2.10, 2.11, 2.12**

Property 4: Bug Condition - HUD and Voice Bar Visible

_For any_ state of the running showcase, the HUD panel SHALL be visible with gear indicator, battery status, g-force meter, safety margin dots, and contextual alerts, and the voice bar SHALL be visible with mic toggle and heard-text display.

**Validates: Requirements 2.7, 2.8(i), 2.9**

Property 5: Preservation - Existing Navigation and Transition Behavior

_For any_ input that does NOT involve the nav rendering bug or missing features (timeline clicks, hash navigation, keyboard arrows, digit keys, animation crossfades, trust moment counting), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing navigation, transition, and event bus functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `showcase/js/core/nav-controls.js`

**Fix**: Ensure `attachAfterRender` always clears the nav-host completely before rendering a single nav element. Verify the bus listener is only attached once.

**Specific Changes**:
1. **Clear nav-host properly**: Ensure `tabletRoot.innerHTML = ''` runs before every render and that no duplicate listeners exist

---

**File**: `showcase/js/core/voice.js` (rewrite)

**Fix**: Replace the single-step voice utility with a full always-on voice service matching the original prototype's architecture.

**Specific Changes**:
1. **Global voice service**: Create a singleton that auto-starts on boot, runs continuously, and handles navigation + step-specific commands
2. **Fuzzy matching**: Port the levenshtein distance function and fuzzyMatch utility
3. **TTS with navBlockedUntil**: Port the speak() function with echo prevention
4. **Step-aware command routing**: Route commands based on current step (zone names in comfort, slide names in learn, etc.)
5. **Voice bar UI**: Render a persistent voice bar with mic toggle, heard-text, and speaking indicator
6. **Auto-restart on browser timeout**: Re-start recognition on `onend` if still supposed to be listening

---

**File**: `showcase/js/modules/onboarding.js` (major rewrite)

**Fix**: Replace all simplified step renderers with full interactive implementations.

**Specific Changes**:
1. **Profile step**: 3-phase biometric flow (name capture → face camera → voice profile) with progress dots, getUserMedia, scanning animation, and sub-step gating
2. **Comfort step**: Interactive seat diagram with 4 clickable hotspot zones, height/tilt sliders, temperature control, ambient lighting picker, voice-activated zone selection
3. **Drive Explained step**: 4-slide interactive slideshow with prev/next buttons, slide counter, indicator dots, TTS narration, voice-activated slide jumping, animated charge bar
4. **Take-over Drill step**: Multi-stage simulation with autonomous driving phase, 10-second countdown ring, hold-to-grip button (press+hold + spacebar), success/failsafe stages, multiple attempts, response time calculation
5. **Preferences step**: Interactive tuning sliders for speed, following distance, and lane aggression with visual preview

---

**File**: `showcase/index.html`

**Fix**: Add HUD panel markup, voice bar markup, and cockpit annotation element.

**Specific Changes**:
1. **HUD panel**: Add gear indicator, battery status, g-force meter, safety margin dots, alert area
2. **Voice bar**: Add persistent bar with mic toggle button, voice-text display, voice-heard display
3. **Cockpit annotation**: Add annotation text element that updates per step

---

**New File**: `showcase/js/core/hud.js`

**Fix**: Create HUD management module.

**Specific Changes**:
1. **HUD context updates**: Port `updateHudContext()` with per-step labels, progress, and warning states
2. **HUD alerts**: Port `showHudAlert()` with color-coded temporary alerts
3. **Cockpit annotations**: Port `updateAnnotation()` with action messages and auto-revert

---

**File**: `showcase/css/components.css`

**Fix**: Add styles for all new interactive components.

**Specific Changes**:
1. **HUD panel styles**: Gear, battery, g-force, safety dots, alerts
2. **Voice bar styles**: Persistent bar, mic button, speaking state
3. **Seat diagram styles**: Hotspots, active zone highlighting, controls
4. **Slideshow styles**: Slide indicators, counter, prev/next buttons
5. **Hold-to-grip styles**: Progress fill, countdown ring, stage transitions
6. **Tuning slider styles**: Option buttons, preview area
7. **Cockpit annotation styles**: Fixed position, action message animation

---

**File**: `showcase/js/main.js`

**Fix**: Wire the new voice service and HUD into the boot sequence.

**Specific Changes**:
1. **Import and initialize voice service** after controller is created
2. **Import and initialize HUD** module
3. **Connect voice commands** to controller.advance/retreat
4. **Connect step changes** to HUD context updates

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate step transitions and check nav-host child count, render onboarding steps and check for interactive elements, and verify voice recognition state across steps. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Nav Accumulation Test**: Transition through 5 steps, assert nav-host has exactly 1 `.nav` child (will fail on unfixed code if buttons accumulate)
2. **Comfort Interactivity Test**: Render comfort step, query for `.hotspot` elements and slider controls (will fail on unfixed code — returns 0 elements)
3. **Voice Persistence Test**: Boot showcase, advance past profile step, check if voice recognition is still active (will fail on unfixed code)
4. **HUD Presence Test**: Boot showcase, query for HUD panel elements (will fail on unfixed code — elements don't exist)
5. **Slideshow Navigation Test**: Render drive-explained step, query for prev/next buttons and slide counter (will fail on unfixed code)

**Expected Counterexamples**:
- nav-host contains N `.nav` children after N transitions instead of 1
- Comfort step tablet contains 0 `.hotspot` elements, 0 slider inputs
- Voice recognition `isListening` is false after leaving profile step
- `document.querySelector('#hud-panel')` returns null

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderStep_fixed(input)
  ASSERT navHostHasExactlyOneNav(result)
  ASSERT stepHasFullInteractivity(result, input.stepSlug)
  ASSERT voiceIsActive(result)
  ASSERT hudIsVisible(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalBehavior(input) = fixedBehavior(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many step transition sequences automatically
- It catches edge cases in keyboard navigation and hash routing
- It provides strong guarantees that animation timing and event ordering are unchanged

**Test Plan**: Observe behavior on UNFIXED code first for timeline clicks, hash navigation, keyboard shortcuts, and animation crossfades, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Timeline Navigation Preservation**: Verify clicking timeline nodes still navigates to correct steps with proper visual state
2. **Hash Routing Preservation**: Verify URL hash changes still decode correctly and navigate to the right step
3. **Keyboard Shortcut Preservation**: Verify ArrowRight/Left and digit keys still work for navigation
4. **Animation Crossfade Preservation**: Verify step transitions still use opacity + translateY crossfade
5. **Event Bus Order Preservation**: Verify stepWillChange → stepDidChange → transitionComplete order is maintained
6. **Trust Moment Preservation**: Verify trust moments still count monotonically during forward navigation

### Unit Tests

- Test nav-controls renders exactly 1 nav element after any number of transitions
- Test voice service fuzzy matching with various transcripts and thresholds
- Test HUD context updates produce correct labels for each step
- Test hold-to-grip progress calculation (mousedown duration → percentage)
- Test slideshow navigation bounds (can't go below 1 or above 4)
- Test seat zone selection updates correct values within bounds

### Property-Based Tests

- Generate random sequences of step transitions and verify nav-host always has exactly 1 `.nav` child
- Generate random voice transcripts and verify fuzzy matching returns correct command or null
- Generate random seat adjustment sequences and verify values stay within bounds (height 1-10, tilt -15° to +15°)
- Generate random slideshow navigation sequences and verify slide index stays within [1, 4]
- Generate random hold durations and verify progress percentage is correct (0-100%)

### Integration Tests

- Test full onboarding flow: profile (3 sub-steps) → comfort (zone selection) → locations → drive-explained (4 slides) → takeover-drill (hold-to-grip success) → preferences (slider adjustment)
- Test voice commands trigger correct actions on each step
- Test HUD updates correctly as steps change
- Test failsafe stage triggers when countdown expires without grip
- Test multiple takeover attempts increment counter correctly
