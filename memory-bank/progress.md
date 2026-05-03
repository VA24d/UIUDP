# Progress

## What Works
- **Step 1 (Profile)**: 3 sub-steps — voice name capture (actual spoken name via Speech Recognition), face scan animation, voice profile recording
- **Step 2 (Comfort)**: Interactive seat diagram with 4 clickable hotspot zones, per-zone height/tilt adjustments, climate control, ambient lighting color picker
- **Step 3 (Location)**: Editable address inputs for home/work, dynamic "add more presets" button
- **Step 4 (Learn)**: 4-slide guided walkthrough — Capabilities (CAN/CAN'T grid), Safety (360° sensor ring), Charging (animated bar + stats), Take-Over (timeline with pulsing wheel icon)
- **Step 5 (Take-Over)**: 3-stage simulation — autonomous driving → warning with 10s SVG countdown → hold-to-override → success with response time. Auto-resets if countdown expires.
- **Step 6 (Tuning)**: Drive preference sliders synced to HUD bars/dots
- **Step 7 (Success)**: Completion screen

### Voice System
- Speech Synthesis talks through every step and sub-interaction
- Speech Recognition with fuzzy matching (Levenshtein distance, threshold 3)
- Commands: next/back/continue/complete, zone names, slide names, "hey aerodrive"
- Voice bar shows TTS text, heard transcript, mic toggle with listening animation
- **Simulator Isolation**: Onboarding voice/logic correctly pauses when switching to the driving simulator

### HUD Instrument Cluster
- Dynamic context label (PROFILE: SETTING UP → CABIN: CALIBRATING → etc.)
- Overall progress bar fills across all 6 steps
- Warning state (red) during take-over drill
- HUD alerts fire on key interactions
- Gear indicator, battery status, drive profile bar, safety margin dots

## Current Status
All 6 steps fully functional and interactive with voice guidance and HUD feedback.

## Known Issues
- Speech Recognition requires Chrome/Edge for full support
- Background image perspective doesn't perfectly match all screen sizes
- No data persistence between reloads (by design — it's a prototype)
