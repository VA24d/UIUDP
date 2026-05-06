# Implementation Tasks

## Task 1: Fix Nav Controls Multiple Back Button Bug
- [x] 1.1 Fix `nav-controls.js` to clear `.nav-host` innerHTML before rendering and ensure only one bus listener is attached
- [x] 1.2 Add guard to prevent duplicate `.nav` elements if `attachAfterRender` fires multiple times in quick succession
- [x] 1.3 Verify Back button is hidden on first step and "End of showcase" shows on last step

## Task 2: Add HUD Panel, Voice Bar, and Cockpit Annotation to HTML
- [x] 2.1 Add HUD panel markup to `showcase/index.html` with gear indicator, battery status, g-force meter, safety margin dots, and alert area
- [x] 2.2 Add persistent voice bar markup to `showcase/index.html` with mic toggle button, voice-text display, and voice-heard display
- [x] 2.3 Add cockpit annotation element to `showcase/index.html`
- [x] 2.4 Add CSS styles for HUD panel (fixed position, glass-morphism, grid layout for indicators)
- [x] 2.5 Add CSS styles for voice bar (bottom-fixed, mic button states, speaking animation)
- [x] 2.6 Add CSS styles for cockpit annotation (subtle text, action-message highlight animation)

## Task 3: Create HUD Management Module
- [x] 3.1 Create `showcase/js/core/hud.js` with `createHUD()` factory that initializes HUD element references
- [x] 3.2 Implement `updateHudContext(step)` with per-step labels, progress bar fill, and warning state toggling
- [x] 3.3 Implement `showHudAlert(msg, color)` with color-coded temporary alerts that auto-dismiss after 2.5 seconds
- [x] 3.4 Implement `updateAnnotation(text, isAction)` with action messages that auto-revert to default after 3 seconds
- [x] 3.5 Wire HUD into `main.js` boot sequence — subscribe to `stepDidChange` bus event to update context per step

## Task 4: Rewrite Voice Module as Always-On Global Service
- [x] 4.1 Rewrite `showcase/js/core/voice.js` to export a `createVoiceService()` factory that auto-starts recognition on boot
- [x] 4.2 Implement levenshtein distance function and `fuzzyMatch(input, candidates, threshold)` utility
- [x] 4.3 Implement `speak(text)` TTS function with voice selection, voice-bar speaking state, and `navBlockedUntil` echo prevention (900ms block after TTS ends)
- [x] 4.4 Implement continuous recognition with auto-restart on `onend`, interim result processing, and command cooldown (1.5s)
- [x] 4.5 Implement navigation command handling: "next", "back", "continue", "skip", "proceed", "forward", "go ahead", "move on" with fuzzy matching
- [x] 4.6 Implement step-specific command routing: zone names in comfort step, slide names in learn step, "complete"/"finish"/"done" in preferences
- [x] 4.7 Implement voice bar UI updates: mic toggle button state, heard-text display, speaking indicator
- [x] 4.8 Wire voice service into `main.js` boot sequence — connect to controller for advance/retreat, subscribe to step changes for context-aware command routing
- [x] 4.9 Add suppression logic: disable voice during driving simulator stages (Req 3.10)

## Task 5: Rewrite Profile Step with 3-Phase Biometric Flow
- [x] 5.1 Implement Phase 1 (Name Capture): mic ring button, speech recognition activation, interim transcription display, name capitalization, editable name/display-name fields, personalized TTS greeting
- [x] 5.2 Implement Phase 2 (Face Biometric): getUserMedia camera request, live video preview in circular scanner, pulsing border scanning animation (~3s), green checkmark confirmation, "Face Registered" HUD alert, graceful fallback if camera denied
- [x] 5.3 Implement Phase 3 (Voice Profile): wake phrase prompt ("Hey AeroDrive, take me home"), voice waveform animation, "Voice Profile Created" HUD alert after ~3.5s
- [x] 5.4 Implement progress dots (3 dots) that update as each sub-step completes (active → done), and "Next" button text changes to "Complete Profile" on final sub-step
- [x] 5.5 Implement sub-step gating: voice "next" command advances between sub-steps but is blocked during face scan animation to prevent skipping
- [x] 5.6 Add CSS styles for profile step: mic ring, face scanner circle, scanning animation, progress dots, voice waveform, checkmark confirmations

## Task 6: Rewrite Comfort Step with Interactive Seat Zones
- [x] 6.1 Implement interactive seat diagram using `seat.png` with CSS transform (rotate/scale) based on current adjustment values
- [x] 6.2 Implement 4 clickable hotspot zones (headrest, backrest, lumbar, cushion) with SVG/CSS overlays and active-zone highlighting
- [x] 6.3 Implement height adjustment controls per zone (1-10 scale) with +/- buttons and numeric display
- [x] 6.4 Implement tilt adjustment controls per zone (-15° to +15°) with +/- buttons and degree display
- [x] 6.5 Implement temperature control with +/- buttons (range 60°F to 85°F) and current value display
- [x] 6.6 Implement ambient lighting color picker with colored dots that set `--cabin-voice-accent` CSS variable
- [x] 6.7 Connect voice-activated zone selection (zone names trigger `selectZone()` via voice service)
- [x] 6.8 Connect HUD updates showing active zone (e.g., "CABIN: LUMBAR") and cockpit annotations for motor/actuator activity
- [x] 6.9 Add CSS styles for comfort step: seat diagram container, hotspot positioning, zone controls panel, color picker dots, temperature display

## Task 7: Rewrite Drive Explained Step with Interactive Slideshow
- [x] 7.1 Implement 4-slide content with proper HTML for each: (1) Level 4 autonomy, (2) Safety shield sensors, (3) Battery/charging with animated charge bar, (4) Take-over protocol
- [x] 7.2 Implement Prev/Next navigation buttons — Prev disabled on slide 1, Next text changes to "Practice Take-Over" on slide 4
- [x] 7.3 Implement slide counter display ("N / 4" format) and 4 indicator dots with active highlighting
- [x] 7.4 Implement TTS voice narration that auto-speaks each slide's explanation on navigation
- [x] 7.5 Connect voice commands: "capabilities", "safety", "charging", "takeover" jump to respective slides via voice service
- [x] 7.6 Implement animated charge bar fill on slide 3 (fills to 80% when slide becomes active)
- [x] 7.7 Implement navigation past slide 4 advances to Take-over Drill step
- [x] 7.8 Add CSS styles for slideshow: slide container, indicator dots, counter, prev/next buttons, charge bar animation

## Task 8: Rewrite Take-over Drill with Hold-to-Grip Simulation
- [x] 8.1 Implement Stage 1 (Autonomous Driving): 3-second display showing car at 65 mph, then auto-transition to Stage 2
- [x] 8.2 Implement Stage 2 (Warning + Countdown): 10-second SVG circular progress ring that depletes, countdown number turns red and enlarges at ≤3s, "⚠ TAKE OVER" HUD alert
- [x] 8.3 Implement hold-to-grip button: press-and-hold (mousedown/touchstart) with progress fill bar animating 0→100% over ~2.5s, releasing early resets to 0%, button label "GRIP STEERING WHEEL"
- [x] 8.4 Implement spacebar support: keydown starts hold, keyup releases — alternative input method for the grip button
- [x] 8.5 Implement Success Stage: grip reaches 100% → countdown stops, button shows "✓ CONTROL SECURED", response time calculated and displayed, TTS congratulations
- [x] 8.6 Implement Failsafe Stage: countdown expires → failsafe message (hazard lights, deceleration, safe stop), TTS explanation, reset simulation after 4 seconds
- [x] 8.7 Implement multiple attempts: attempt counter ("ATTEMPT 1", "ATTEMPT 2"), full simulation reset between attempts
- [x] 8.8 Connect HUD integration: "⚠ TAKE-OVER DRILL" during countdown, "TAKE-OVER: SECURED" on success
- [x] 8.9 Add CSS styles for takeover drill: countdown ring SVG, hold button with progress fill, stage transitions, attempt counter, failsafe styling

## Task 9: Rewrite Preferences Step with Interactive Tuning Sliders
- [x] 9.1 Implement acceleration/speed tuning with 3 options (Smooth/Standard/Dynamic) as clickable option buttons with active state
- [x] 9.2 Implement following distance tuning with 3 options (Close/Medium/Far) as clickable option buttons
- [x] 9.3 Implement lane preference tuning with 3 options (Left/Center/Right) as clickable option buttons
- [x] 9.4 Implement visual preview area showing car position, following distance label, speed, and g-force values that update with selections
- [x] 9.5 Connect HUD sync: acceleration bar width, distance dots, and contextual annotations on preference changes
- [x] 9.6 Connect voice commands: "complete"/"finish"/"done" triggers setup completion via voice service
- [x] 9.7 Add CSS styles for preferences step: option button grid, active states, preview area with car visualization

## Task 10: Integration and Polish
- [x] 10.1 Ensure voice service correctly routes step-specific commands based on current active step index from controller
- [x] 10.2 Ensure all step transitions properly clean up timers, camera streams, and intervals from previous steps (prevent memory leaks)
- [x] 10.3 Ensure HUD, voice bar, and cockpit annotation update correctly on every step change via bus events
- [x] 10.4 Test full flow: boot → profile (3 phases) → comfort (zone interaction) → locations → drive-explained (4 slides) → takeover-drill (hold success + failsafe) → preferences → completion
- [x] 10.5 Ensure voice suppression activates when entering driving/riding stages and re-enables when returning to onboarding
- [x] 10.6 Add keyboard accessibility: spacebar for grip button, ensure all interactive elements are focusable and operable via keyboard
