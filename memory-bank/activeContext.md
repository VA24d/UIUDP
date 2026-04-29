# Active Context

## Current Work Focus
- Finalized the 6-step autonomous vehicle onboarding prototype
- All steps fully functional with interactive elements and voice integration
- HUD instrument cluster provides dynamic per-step feedback

## Recent Changes
### Voice System (Major Addition)
- **Microphone Access**: Now requested immediately on page load via `getUserMedia` to ensure a seamless "voice-first" experience from the start.
- **Blazing Fast Speech Recognition**: Recognition now evaluates interim results, executing commands instantly without waiting for the `isFinal` timeout. It returns `true` on match, stopping and resetting the buffer for a much faster feel.
- **Speech Synthesis (TTS)**: Car speaks contextual instructions at every step transition and sub-interaction
- **Fuzzy Matching**: Uses Levenshtein distance (threshold 3) to catch slight mishearings.
- **Voice Commands**: "next", "back", "continue", "complete", plus step-specific: zone names on comfort, slide names on learn.
- **Actual Name Capture**: Step 1 uses real speech recognition to capture the user's spoken name (not hardcoded).
- **Voice bar UI**: Bottom bar shows TTS text, heard transcript, mic toggle, and speaker pulse animation.

### Driver Dashboard (formerly HUD)
- **Clean Side-by-Side Layout**: Removed the simulated 3D car interior background (`bg.png`) in favor of a clean, side-by-side presentation view (`.cockpit-layout`). The Main Infotainment screen sits perfectly beside the Steering Wheel Dashboard for clear, focused interaction.
- **Embedded Digital Cluster**: Changed the floating HUD into a glassmorphic dashboard container.
- **Integrated Alerts**: Alerts now overtake the entire dashboard display as a blurred overlay, keeping critical information contained in the gauge cluster instead of floating on the windshield.
- **Dynamic Context**: Label updates per step (e.g., "PROFILE: SETTING UP", "⚠ TAKE-OVER DRILL") with a filling progress bar.

### Comfort Step (Step 2) — Interactive Seat
- Clickable hotspot zones on a seat diagram (headrest, backrest, lumbar, cushion)
- Per-zone height and tilt adjustments with +/- buttons
- Seat image visually rotates/scales in response to adjustments
- Climate control with temp up/down, ambient lighting color picker

### Background
- Generated futuristic concept car interior (driver POV, steering wheel on left, showroom through windshield)

## Next Steps
- User testing and visual polish
- Potentially add fingerprint registration sub-step to profile
- Consider adding "Service & Diagnostics" section

## Important Patterns
- Voice commands use fuzzy matching with Levenshtein distance (threshold: 3)
- Steps loaded dynamically via fetch API into module-container
- Steps 1 and 4 have internal sub-navigation (profile sub-steps, learn slides)
- HUD and central display are fully decoupled — communicate via JS functions
