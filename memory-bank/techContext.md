# Tech Context

## Stack
- **HTML5** — semantic structure, modular step files
- **CSS3** — vanilla CSS, no frameworks. Glassmorphism, CSS animations, SVG
- **JavaScript (ES6+)** — vanilla JS, no frameworks or build tools
- **Web Speech API** — SpeechSynthesis (TTS) + SpeechRecognition (STT)
- **Phosphor Icons** — icon library via CDN (`https://unpkg.com/@phosphor-icons/web`)
- **Google Fonts** — Inter typeface

## Development Setup
- Static file server: `python -m http.server 8080`
- No build step, no package manager — pure vanilla web
- All files in `/Users/va/UIUDP/`

## Browser Requirements
- **Chrome or Edge** recommended (full Web Speech API support)
- Safari has partial SpeechRecognition support
- Microphone permission required for voice commands

## Key APIs Used
- `fetch()` — dynamic HTML module loading
- `SpeechSynthesisUtterance` — car voice output
- `SpeechRecognition` — continuous voice input with interim results
- `CSS @keyframes` — road animation, pulse rings, scan lines, countdown
- `SVG circle stroke-dashoffset` — countdown ring animation

## Constraints
- No external API calls (everything runs locally in browser)
- No user data persistence (prototype resets on reload)
- Background image is a generated PNG, not a live camera feed
- Speech recognition accuracy depends on browser and mic quality
