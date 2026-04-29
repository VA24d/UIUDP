# System Patterns

## Architecture
- **Dual Display Layout**: HUD (instrument cluster, top-left) + Central Display (infotainment, center)
- **Modular Step Files**: Each onboarding step is a separate HTML file in `steps/` directory
- **Dynamic Loading**: `loadStep(n)` fetches HTML via `fetch()` and injects into `#module-container`
- **Cross-Display Communication**: JS functions update HUD elements in response to central display interactions

## State Management
- `currentStep` — which onboarding step (1-7) is active
- `profileSubStep` — sub-step within profile creation (0-3)
- `currentSlide` — which learn slide is active (1-4)
- `activeZone` — which seat zone is selected in comfort
- `isListening` — whether speech recognition is active
- `awaitingName` — whether we're capturing a spoken name

## Voice System
- **TTS**: `speak(text)` cancels previous utterance, speaks new one, updates voice bar UI
- **Recognition**: Web Speech API with `continuous: true` and `interimResults: true`
- **Fuzzy Matching**: `fuzzyMatch(input, candidates, threshold)` using Levenshtein distance
- **Command Routing**: `handleVoiceCommand(transcript)` routes to step-specific handlers
- **Name Capture**: `awaitingName` flag intercepts next recognition result as the user's name

## UI Patterns
- Glassmorphic panels with `backdrop-filter: blur(40px)` and subtle borders
- Interactive hotspots with pulse animations on hover/active
- Hold-to-confirm pattern for take-over simulation
- SVG countdown ring for visual urgency
- Animated road lines for driving simulation
- Color-coded context: blue (info), green (success), red/amber (warning/critical)

## File Structure
```
UIUDP/
├── index.html          # Main shell with HUD + Central Display
├── style.css           # All styles
├── script.js           # All logic (voice, steps, state)
├── bg.png              # Cockpit background image
├── seat.png            # Seat diagram for comfort step
├── steps/
│   ├── step1.html      # Profile creation (3 sub-steps)
│   ├── step2.html      # Comfort config (interactive seat)
│   ├── step3.html      # Location presets
│   ├── step4.html      # Learn slideshow (4 slides)
│   ├── step5.html      # Take-over simulation (3 stages)
│   ├── step6.html      # Drive tuning
│   └── success.html    # Completion screen
└── memory-bank/        # Project documentation
```

## Key Design Decisions
- Voice-first interaction: system talks, user can respond by voice or touch
- Futuristic concept car aesthetic (BMW Vision Next 100 / Mercedes AVTR inspired)
- Take-over section treated as critical — red badges, detailed timeline, mandatory practice
- HUD provides always-visible context about what's happening in the onboarding
