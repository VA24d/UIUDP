# Bugfix Requirements Document

## Introduction

Multiple interaction and visual polish issues in the Unified AV Showcase prevent the demo from functioning as intended. The reroute choice card in the battery step doesn't trigger its animation, the voice service auto-starts without a user gesture (causing browser blocks), the cluster panel is sparse during riding steps, the hold-to-grip mechanic is missing from the driving unmapped-zone takeover, and there are no transition cards between major phases. These issues collectively degrade the showcase experience and must be fixed to deliver a polished, functional demo.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user clicks the "Reroute to nearest charger" choice card in the battery step THEN the system does nothing — no reroute animation plays and the step does not advance

1.2 WHEN the user clicks the "Continue on planned route" choice card in the battery step THEN the system does nothing — no visual feedback or advancement occurs

1.3 WHEN the showcase boots THEN the voice service calls `startListening()` immediately without a user gesture, causing the browser to block microphone access silently

1.4 WHEN the user is on a riding step (environment, maneuver, productive-time) THEN the cluster panel shows only basic text (title, speed, one pill) without the perception HUD mini-view, safe-zone indicator, or passenger mode pill

1.5 WHEN the driving unmapped-zone takeover prompt appears THEN the system shows a simple "Grip wheel" click button without the hold-to-grip mechanic, progress fill bar, countdown ring, or spacebar support that exists in the onboarding takeover drill

1.6 WHEN the showcase transitions from the last onboarding step to the first driving step THEN no transition/intro card is shown — the driving step appears immediately without context

1.7 WHEN the showcase transitions from the last driving step to the first riding step THEN no transition/intro card is shown — the riding step appears immediately without context

### Expected Behavior (Correct)

2.1 WHEN the user clicks the "Reroute to nearest charger" choice card THEN the system SHALL play the map reroute animation (route line animates to detour path, charger pin pulses) AND THEN advance to the next step after the animation completes (~1.5s)

2.2 WHEN the user clicks the "Continue on planned route" choice card THEN the system SHALL show a brief "Low-power mode armed" confirmation AND THEN advance to the next step

2.3 WHEN the showcase boots THEN the voice service SHALL NOT auto-start recognition; it SHALL wait for the user to click the mic button (user gesture) before calling `recognition.start()`, and the voice bar SHALL display "Mic off — tap to listen" initially

2.4 WHEN the user is on a riding step THEN the cluster panel SHALL show a mini perception radar SVG, speed readout with units, a "PASSENGER MODE" pill, and the safe-zone bar indicator matching the current riding sub-step

2.5 WHEN the driving unmapped-zone takeover prompt appears THEN the system SHALL show the same hold-to-grip mechanic as the onboarding drill: a grip button with progress fill bar that requires press-and-hold (2.5s), a countdown ring, spacebar support, and tactile pulse animations

2.6 WHEN the showcase transitions from the last onboarding step to the first driving step THEN the system SHALL display a transition card announcing "Entering Driving Mode" with a brief description and auto-advance after 3 seconds (or click to skip)

2.7 WHEN the showcase transitions from the last driving step to the first riding step THEN the system SHALL display a transition card announcing "Entering Passenger Mode" with a brief description and auto-advance after 3 seconds (or click to skip)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user clicks the "Confirm choice" button in the battery step THEN the system SHALL CONTINUE TO advance to the next step via `controller.advance()`

3.2 WHEN the user clicks the mic button after boot THEN the voice service SHALL CONTINUE TO start recognition and function normally for voice commands

3.3 WHEN the user is on an onboarding step THEN the cluster panel SHALL CONTINUE TO show the onboarding progress pips and step context as before

3.4 WHEN the user performs the hold-to-grip in the onboarding takeover drill THEN the existing mechanic (progress fill, spacebar, countdown, success/failsafe states) SHALL CONTINUE TO work identically

3.5 WHEN the user navigates between steps within the same phase (e.g., onboarding step 2 to step 3) THEN no transition card SHALL appear — transition cards only appear at phase boundaries

3.6 WHEN the user is on a driving step THEN the cluster panel SHALL CONTINUE TO show the driving-specific content (speed, autonomy level, alert pill)

3.7 WHEN POI pins are clicked in the battery map THEN tooltips with relevance info SHALL CONTINUE TO appear correctly
