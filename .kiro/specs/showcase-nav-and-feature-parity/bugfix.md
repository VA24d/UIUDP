# Bugfix Requirements Document

## Introduction

The showcase application (`showcase/`) has multiple related bugs: (1) multiple "← Back" buttons appear in the navigation area instead of a single Back button, (2) many interactive features from the original prototype (`index.html` + `script.js`) are missing or severely simplified in the showcase port, and (3) the voice/mic system is fundamentally broken — it only activates during the profile step and stops, whereas the original prototype auto-starts on boot and continuously listens across ALL steps for navigation and step-specific commands. The original prototype includes always-on voice commands with TTS/speech recognition, fuzzy matching, live webcam face scanning, interactive seat zones with height/tilt sliders, temperature control, ambient lighting picker, a 4-slide learn slideshow with navigation, a multi-attempt take-over simulation with hold-to-grip, tuning sliders, a HUD with gear/battery/g-force/alerts, a persistent voice bar, and cockpit annotations. The showcase reduces most of these to static placeholders or omits them entirely.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the showcase renders navigation controls THEN the system displays multiple "← Back" buttons in a row above the timeline instead of a single Back button

1.2 WHEN the showcase renders the Profile step (onboarding step 1) THEN the system only shows a basic mic button and a "Save profile" CTA without: a multi-sub-step flow with progress dots, live face camera preview via getUserMedia, scanning animation with pulsing border, face registration confirmation with green checkmark, voice profile capture phase with waveform animation, or sub-step gating that blocks "next" during face scan

1.3 WHEN the showcase renders the Comfort step (onboarding step 2) THEN the system shows three static tiles (Seat: Preset 1, Mirror: Auto, Climate: 22°C) without an interactive seat diagram, clickable hotspot zones (headrest, backrest, lumbar, cushion), height adjustment (1-10 scale), tilt adjustment (-15° to +15°), visual seat rotation/scale feedback, temperature control with +/- buttons, or ambient lighting color picker

1.4 WHEN the showcase renders the Drive Explained step (onboarding step 4) THEN the system shows only slide 1 text statically ("AeroDrive is autonomous on highways and city arterials.") without prev/next navigation buttons, slide counter ("N / 4"), slide indicator dots, voice narration per slide, voice-activated slide jumping, animated charge bar on slide 3, or the ability to navigate past slide 4 into the take-over drill

1.5 WHEN the showcase renders the Take-over Drill step (onboarding step 5) THEN the system shows only a countdown timer and a simple "Grip wheel" click button without a hold-to-grip mechanic (press-and-hold with progress fill), spacebar support, multiple attempts with failsafe stage, response time calculation, or attempt counter

1.6 WHEN the showcase renders the Preferences step (onboarding step 6) THEN the system shows only choice cards (Balanced/Dynamic) without interactive sliders for speed, following distance, and lane aggression

1.7 WHEN the showcase is running THEN the system does not display a HUD (Head-Up Display) with gear indicator, battery status, g-force meter, safety margin dots, or contextual alerts

1.8 WHEN the showcase is running THEN the voice system only activates during the profile step and stops after that step completes, instead of being an always-on continuous recognition service that auto-starts on boot, listens across ALL steps, handles navigation commands ("next", "back", "continue", "skip", "proceed", "forward"), handles step-specific commands (zone names in comfort, slide names in learn, "complete"/"finish" in preferences), uses fuzzy/levenshtein matching, provides TTS contextual messages per step, and blocks navigation briefly after TTS ends to prevent speaker→mic echo

1.9 WHEN the showcase is running THEN the system does not display cockpit annotation text showing simulation context per step

1.10 WHEN the user says a navigation command like "next" or "back" on any step other than profile THEN the system does not respond because voice recognition has already been stopped

1.11 WHEN the user says a zone name like "headrest" or "lumbar" during the comfort step THEN the system does not select that zone because (a) voice is not active and (b) the comfort step has no interactive zones to select

1.12 WHEN the user says a slide name like "safety" or "takeover" during the learn step THEN the system does not navigate to that slide because voice is not active on that step

### Expected Behavior (Correct)

2.1 WHEN the showcase renders navigation controls THEN the system SHALL display exactly one "← Back" button (hidden on the first step) and one "Next →" button (or "End of showcase" on the last step) in the `.nav-host` area

2.2 WHEN the showcase renders the Profile step THEN the system SHALL display a multi-sub-step flow with three phases and progress dots:
- (a) **Name capture phase**: A mic ring button that, when tapped, activates speech recognition to capture the user's spoken name. Shows interim transcription in real-time, capitalizes the captured name, populates editable name/display-name fields, and speaks a personalized greeting ("Nice to meet you, [name]")
- (b) **Face biometric phase**: Requests camera access via getUserMedia, displays a live video preview inside a circular scanner element, runs a scanning animation (pulsing border) for ~3 seconds, then shows a green checkmark confirmation with "Face Registered" HUD alert. If camera is denied, shows a placeholder checkmark and continues gracefully
- (c) **Voice profile phase**: Prompts the user to say a wake phrase ("Hey AeroDrive, take me home"), displays a voice waveform animation, then confirms with "Voice Profile Created" HUD alert after ~3.5 seconds
- (d) Progress dots (3 dots) update as each sub-step completes (active → done), and the "Next" button text changes to "Complete Profile" on the final sub-step
- (e) The voice command "next" advances between sub-steps (but is blocked during face scan animation to prevent skipping)

2.3 WHEN the showcase renders the Comfort step THEN the system SHALL display:
- (a) An interactive seat diagram using the seat.png image that visually rotates and scales based on current adjustment values
- (b) Four clickable hotspot zones (headrest, backrest, lumbar, cushion) with visual highlighting on the active zone
- (c) Height adjustment controls per zone on a 1-10 scale with +/- buttons and numeric display
- (d) Tilt adjustment controls per zone from -15° to +15° with +/- buttons and degree display
- (e) Temperature control with +/- buttons displaying current value in °F (range 60°F to 85°F)
- (f) Ambient lighting color picker with colored dots that set the --cabin-voice-accent CSS variable on selection
- (g) Voice-activated zone selection so saying "headrest", "backrest", "lumbar", or "cushion" selects that zone
- (h) HUD updates showing which zone is currently active (e.g., "CABIN: LUMBAR")
- (i) Cockpit annotations showing motor/actuator activity text when adjustments are made

2.4 WHEN the showcase renders the Drive Explained step THEN the system SHALL display a 4-slide interactive slideshow with:
- (a) Four content slides covering: (1) Level 4 autonomy capabilities, (2) Safety shield sensors (cameras, LIDAR, radar), (3) Battery range and fast charging stats with an animated charge bar, (4) Critical take-over protocol explanation
- (b) Prev/Next navigation buttons — Prev disabled on slide 1, Next button text changes to "Practice Take-Over" on slide 4
- (c) A slide counter display showing "N / 4" format
- (d) Slide indicator dots (4 dots) with the active slide highlighted
- (e) TTS voice narration that auto-speaks each slide's explanation when navigated to
- (f) Voice commands: saying "capabilities", "safety", "charging", or "takeover" jumps directly to that slide
- (g) An animated charge bar fill on slide 3 (fills to 80% when that slide becomes active)
- (h) Navigating past slide 4 advances to the Take-over Drill step

2.5 WHEN the showcase renders the Take-over Drill step THEN the system SHALL display a multi-stage simulation with:
- (a) **Stage 1 — Autonomous driving** (~3 seconds): Shows the car driving autonomously at 65 mph, then transitions to the warning stage
- (b) **Stage 2 — Warning + countdown**: Displays a 10-second countdown with a circular SVG progress ring that depletes, the countdown number turns red and enlarges at ≤3 seconds, and a "⚠ TAKE OVER" HUD alert fires
- (c) **Hold-to-grip button**: A large button labeled "GRIP STEERING WHEEL" that the user must PRESS AND HOLD (mousedown/touchstart). While held, a progress fill bar animates from 0% to 100% over ~2.5 seconds. Releasing early resets progress to 0%. The button also responds to SPACEBAR (keydown = start hold, keyup = release) as an alternative input method
- (d) **Success stage**: When grip reaches 100%, the countdown stops, the button shows "✓ CONTROL SECURED", the response time is calculated and displayed (e.g., "3.2 seconds"), and TTS speaks congratulations with the time
- (e) **Failsafe stage**: If the 10-second countdown expires without a successful grip, the system shows a failsafe message ("hazard lights on, gradual deceleration, safe stop"), speaks an explanation, then resets the simulation for another attempt after 4 seconds
- (f) **Multiple attempts**: An attempt counter ("ATTEMPT 1", "ATTEMPT 2", etc.) tracks retries. The simulation resets fully between attempts (all stages hidden except stage 1)
- (g) **HUD integration**: Updates HUD context label to "⚠ TAKE-OVER DRILL" during countdown and "TAKE-OVER: SECURED" on success

2.6 WHEN the showcase renders the Preferences step THEN the system SHALL display interactive sliders for speed, following distance, and lane aggression tuning, matching the original prototype's tuning controls

2.7 WHEN the showcase is running THEN the system SHALL display a HUD panel with gear indicator, battery status, g-force/drive profile meter, safety margin dots, and contextual alert area that updates per step

2.8 WHEN the showcase is running THEN the system SHALL provide an always-on, continuous voice recognition service that:
- (a) Auto-starts on application boot without requiring any user action (matching the original's DOMContentLoaded → toggleMic() pattern)
- (b) Runs continuously across ALL onboarding steps, not just the profile step
- (c) Recognizes navigation commands on every step: "next", "back", "continue", "skip", "proceed", "forward", "go ahead", "move on"
- (d) Recognizes step-specific commands: zone names ("headrest", "backrest", "lumbar", "cushion") in the comfort step, slide names ("capabilities", "safety", "charging", "takeover") in the learn step, and "complete"/"finish"/"done" in the preferences step
- (e) Uses fuzzy matching (levenshtein distance ≤ 3) so imprecise speech still triggers the correct command
- (f) Provides TTS (text-to-speech) that speaks contextual messages when entering each step and on key interactions
- (g) Blocks navigation commands for ~900ms after TTS ends to prevent speaker→mic echo from triggering false "next" commands (navBlockedUntil pattern)
- (h) Auto-restarts recognition on browser timeout/end events to maintain continuous listening
- (i) Displays a persistent voice bar UI with mic toggle button, heard-text display, and speaking state indicator

2.9 WHEN the showcase is running THEN the system SHALL display cockpit annotation text that updates contextually per step to describe the current simulation state

2.10 WHEN the user says a navigation command like "next" or "back" on any step THEN the system SHALL process the command and navigate accordingly (advance to next step, go back to previous step, or handle sub-step navigation within profile/learn steps)

2.11 WHEN the user says a zone name like "headrest" or "lumbar" during the comfort step THEN the system SHALL select that zone, highlight it visually, reveal its height/tilt controls, update the HUD, and speak a confirmation

2.12 WHEN the user says a slide name like "safety" or "takeover" during the learn step THEN the system SHALL navigate to that slide and speak the slide's voice narration

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user navigates between steps using keyboard arrows, digit keys, or timeline clicks THEN the system SHALL CONTINUE TO transition between steps with the existing animation controller crossfade behavior

3.2 WHEN the user is on the first step THEN the system SHALL CONTINUE TO hide the Back button and show only the Next button

3.3 WHEN the user is on the last step THEN the system SHALL CONTINUE TO show the "End of showcase" indicator instead of a Next button

3.4 WHEN the user navigates via URL hash THEN the system SHALL CONTINUE TO decode the hash and navigate to the correct step or show an error toast for invalid hashes

3.5 WHEN a step transition occurs THEN the system SHALL CONTINUE TO emit stepWillChange, stepDidChange, and transitionComplete events on the bus in the correct order

3.6 WHEN the showcase boots THEN the system SHALL CONTINUE TO follow the deterministic boot order: theme → bus → registry → router → controller → animation → timeline → nav → initial render

3.7 WHEN the user interacts with the timeline nodes THEN the system SHALL CONTINUE TO allow click and keyboard navigation to any step with correct visual state (filled/active/unfilled)

3.8 WHEN trust moments are accumulated during forward navigation THEN the system SHALL CONTINUE TO count them monotonically and display the running total in the timeline trust counter

3.9 WHEN the user clicks the "Save profile" / "Save cabin" / other step CTA buttons THEN the system SHALL CONTINUE TO advance to the next step via the existing completeThenAdvance flow

3.10 WHEN the showcase is in the driving simulator pane (not onboarding) THEN the system SHALL CONTINUE TO suppress voice recognition and TTS to avoid interference with the simulator
